var _ = require('underscore'),
  bag = require('bagofholding'),
  Jenkins = require('./jenkins'),
  jenkins = new Jenkins(process.env.JENKINS_URL, process.env.http_proxy);

function _build(jobName, params, args) {
  if (!args) {
    args = params || {};
  }

  var message = 'Job %s was started successfully',
    cb;

  if (args.console) {
    cb = function (err, result) {
      if (err) {
        bag.cli.exit(err, result);
      } else {
        console.log(message, jobName);
        // wait for pending period
        setTimeout(function () {
          _console()(jobName);
        }, 5000);
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

function _stop(jobName, params) {
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
        console.log('%s - %s', job.status, job.name);
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
    console.log('%s | %s', name, result.status);
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

/**
 * Execute Nestor.
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
      ver: { action: _version }
    }
  };

  bag.cli.command(__dirname, actions);
}

exports.exec = exec;