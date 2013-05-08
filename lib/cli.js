/*jshint esnext: true */
const COLORS = {  
  OK: 'green',
  ABORTED: 'grey',
  FAIL: 'red',
  WARN: 'yellow'
};

var _ = require('underscore'),
  bag = require('bagofholding'),
  BuildLight = require('./notifiers/buildlight'),
  colors = require('colors'),
  irc = require('./irc'),
  Jenkins = require('./jenkins'),
  NinjaBlocks = require('./notifiers/ninjablocks'),
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

function _feed(args) {
  args = args || {};
  var opts = {
    jobName: args.job,
    viewName: args.view
  };
  jenkins.feed(opts, bag.cli.exitCb(null, function (result) {
    result.forEach(function (article) {
      console.log(article.title);
    });
  }));
}

function __monitor(notifier, args) {
  args = args || {};
  var opts = {
    jobName: args.job,
    viewName: args.view,
    schedule: args.schedule
  };
  jenkins.monitor(opts, function (err, result) {
    if (err) {
      console.error(err.message);
    } else {
      notifier.notify(result);
    }
  });
}

function _ninja(args) {
  var ninjaBlocks = new NinjaBlocks(process.env.NINJABLOCKS_TOKEN);
  __monitor(ninjaBlocks, args);
}

function _buildLight(args) {
  var buildLight = new BuildLight({
    scheme: args.scheme ? args.scheme.split(',') : undefined,
    usbled: args.usbled
  });
  __monitor(buildLight, args);
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
      ninja: { action: _ninja },
      buildlight: { action: _buildLight }
    }
  };

  bag.cli.command(__dirname, actions);
}

exports.exec = exec;
