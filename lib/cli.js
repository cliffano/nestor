/*jshint esnext: true */
const COLORS = {  
  OK: 'green',
  ABORTED: 'grey',
  FAIL: 'red',
  WARN: 'yellow'
};

var _ = require('underscore'),
  bag = require('bagofholding'),
  colors = require('colors'),
  irc = require('./irc'),
  Jenkins = require('./jenkins'),
  NinjaBlocks = require('./ninjablocks'),
  jenkins = new Jenkins();

function _build(jobName, params, args) {
  if (!args) {
    args = params || {};
  }

  const PENDING = 5000;
  var message = 'Job %s was started successfully',
    cb;

  if (args.console) {
    cb = function (err, result) {
      if (err) {
        bag.cli.exit(err, result);
      } else {
        console.log(message, jobName);
        // wait for pending period before calling console
        setTimeout(function () {
          _console(jobName);
        }, args.pending || PENDING);
      }
    };
  } else {
    cb = bag.cli.exitCb(null, function (result) {
      console.log(message, jobName);
    });
  }

  jenkins.build(jobName, (_.isString(params)) ? params : undefined, cb);
}

function _console(jobName) {
  jenkins.console(jobName, bag.cli.exit);
}

function _stop(jobName) {
  jenkins.stop(
    jobName,
    bag.cli.exitCb(null, function (result) {
      console.log('Job %s was stopped successfully', jobName);
    })
  ); 
}

function _dashboard() {
  jenkins.dashboard(bag.cli.exitCb(null, function (result) {
    if (result.length === 0) {
      console.log('Jobless Jenkins');
    } else {
      result.forEach(function (job) {
        console.log('%s - %s', job.status[COLORS[job.status] || 'grey'], job.name);
      });
    }
  }));
}

function _discover(host) {
  host = (_.isString(host)) ? host : 'localhost';
  jenkins.discover(host, bag.cli.exitCb(null, function (result) {
    console.log('Jenkins ver. %s is running on %s',
        result.hudson.version[0],
        (result.hudson.url && result.hudson.url[0]) ? result.hudson.url[0] : host);
  }));
}

function _executor() {
  jenkins.executor(bag.cli.exitCb(null, function (result) {
    if (!_.isEmpty(_.keys(result))) {
      _.keys(result).forEach(function (computer) {
        console.log('+ ' + computer);
        result[computer].forEach(function (executor) {
          if (executor.idle) {
            console.log('  - idle');
          } else {
            console.log('  - %s | %s%%s', executor.name, executor.progress, (executor.stuck) ? ' stuck!' : '');
          }
        });
      });
    } else {
      console.log('No executor found');
    }
  }));
}

function _job(name) {
  jenkins.job(name, bag.cli.exitCb(null, function (result) {
    console.log('%s | %s', name, result.status[COLORS[result.status] || 'grey']);
    result.reports.forEach(function (report) {
      console.log(' - %s', report);
    });
  }));
}

function _queue() {
  jenkins.queue(bag.cli.exitCb(null, function (result) {
    if (result.length === 0) {
      console.log('Queue is empty');
    } else {
      result.forEach(function (job) {
        console.log('- %s', job);
      });
    }
  }));
}

function _version() {
  jenkins.version(bag.cli.exitCb(null, function (result) {
    console.log('Jenkins ver. %s', result);
  }));
}

function _irc(host, channel, nick) {
  nick = (_.isString(nick)) ? nick : undefined;
  irc.start(host, channel, nick);
}

function _feed(jobName) {
  jobName = (_.isString(jobName)) ? jobName : undefined;
  jenkins.feed(jobName, bag.cli.exitCb(null, function (result) {
    result.forEach(function (article) {
      console.log(article.title);
    });
  }));
}

function _ninja(jobName, schedule) {
  if (!_.isString(jobName) || !_.isString(schedule)) {
    // no arg specified
    if (!_.isString(jobName) && !_.isString(schedule)) {
      jobName = null;
      schedule = null;
    // one arg specified, cron schedule
    } else if (!_.isString(schedule) && jobName.match(/^.+\s.+\s.+\s.+\s.+/)) {
      schedule = jobName;
      jobName = null;
    // one arg specified, job name
    } else {
      schedule = null;
    }
  }

  var ninjaBlocks = new NinjaBlocks(process.env.NINJABLOCKS_TOKEN);
  jenkins.monitor(jobName, schedule, function (err, result) {
    if (err) {
      console.error(err.message);
    } else {
      ninjaBlocks.notify(result);
    }
  });
}

/**
 * Execute Nestor CLI.
 */
function exec() {

  var actions = {
    commands: {
      build: { action: _build },
      console: { action: _console },
      stop: { action: _stop },
      dashboard: { action: _dashboard },
      discover: { action: _discover },
      executor: { action: _executor },
      job: { action: _job },
      queue: { action: _queue },
      ver: { action: _version },
      irc: { action: _irc },
      feed: { action: _feed },
      ninja: { action: _ninja }
    }
  };

  bag.cli.command(__dirname, actions);
}

exports.exec = exec;
