var _ = require('underscore'),
  bag = require('bagofholding'),
  jenkins = require('./jenkins');

/**
 * Execute nestor using JENKINS_URL environment variable.
 * Nestor uses http_proxy environment variable when it's available.
 */
function exec() {

  var url = process.env.JENKINS_URL,
    proxy = process.env.http_proxy;

  function _build() {
    return function (jobName, params) {
      new jenkins(url, proxy).build(
        jobName,
        (_.isString(params)) ? params : undefined,
        bag.cli.exitCb(null, function (result) {
          console.log('Job %s was started successfully', jobName);
        })
      );
    }; 
  }

  function _dashboard() {
    return function () {
      new jenkins(url, proxy).dashboard(bag.cli.exitCb(null, function (result) {
        if (result.length === 0) {
          console.log('Jobless Jenkins');
        } else {
          result.forEach(function (job) {
            console.log('%s - %s', job.status, job.name);
          });
        }
      }));
    }; 
  }

  function _discover() {
    return function (host) {
      new jenkins(url, proxy).discover(host, bag.cli.exitCb(null, function (result) {
        console.log('Jenkins ver. %s is running on %s', result.version, result.url);
      }));
    };
  }

  function _executor() {
    return function () {
      new jenkins(url, proxy).executor(bag.cli.exitCb(null, function (result) {
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
    };
  }

  function _job() {
    return function (name) {
      new jenkins(url, proxy).job(name, bag.cli.exitCb(null, function (result) {
        console.log('%s | %s', name, result.status);
        result.reports.forEach(function (report) {
          console.log(' - %s', report);
        });
      }));
    };
  }

  function _queue() {
    return function () {
      new jenkins(url, proxy).queue(bag.cli.exitCb(null, function (result) {
        if (result.length === 0) {
          console.log('Queue is empty');
        } else {
          result.forEach(function (job) {
            console.log('- %s', job);
          });
        }
      }));
    }; 
  }

  function _version() {
    return function () {
      new jenkins(url, proxy).version(bag.cli.exitCb(null, function (result) {
        console.log('Jenkins ver. %s', result);
      }));
    };
  }
  
  var commands = {
    build: {
      desc: 'Trigger a build with optional parameters\n\tnestor build <jobname> ["param1=value1&param2=value2"]',
      action: _build()
    },
    dashboard: {
      desc: 'View status of all jobs\n\tnestor dashboard',
      action: _dashboard()
    },
    discover: {
      desc: 'Discover Jenkins instance running on a specified host\n\tnestor discover <hostname>',
      action: _discover()
    },
    executor: {
      desc: 'View executors\' status (running builds)\n\tnestor executor',
      action: _executor()
    },
    job: {
      desc: 'View job status reports\n\tnestor job <jobname>',
      action: _job()
    },
    queue: {
      desc: 'View queued jobs\n\tnestor queue',
      action: _queue()
    },
    ver: {
      desc: 'View Jenkins version number\n\tnestor ver',
      action: _version()
    }
  };

  bag.cli.parse(commands, __dirname);
}

exports.exec = exec;
