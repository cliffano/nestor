var _ = require('underscore'),
  bag = require('bagofholding'),
  jenkins = require('./jenkins');

/**
 * cli#exec
 * 
 * Execute nestor using JENKINS_URL environment variable.
 **/
function exec() {

  var url = process.env.JENKINS_URL || 'http://localhost:8080';

  function _build() {
    return function (jobName, params) {
      new jenkins(url).build(
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
      new jenkins(url).dashboard(bag.cli.exitCb(null, function (result) {
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
      new jenkins(url).discover(host, bag.cli.exitCb(null, function (result) {
        console.log('Jenkins ver. %s is running on %s', result.version, result.url);
      }));
    };
  }

  function _executor() {
    return function () {
      new jenkins(url).executor(bag.cli.exitCb(null, function (result) {
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
      new jenkins(url).job(name, bag.cli.exitCb(null, function (result) {
        console.log('%s | %s', name, result.status);
        result.reports.forEach(function (report) {
          console.log(' - %s', report);
        });
      }));
    };
  }

  function _queue() {
    return function () {
      new jenkins(url).queue(bag.cli.exitCb(null, function (result) {
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
      new jenkins(url).version(bag.cli.exitCb(null, function (result) {
        console.log('Jenkins ver. %s', result);
      }));
    };
  }
  
  var commands = {
    build: {
      desc: 'Trigger a build with optional parameters',
      action: _build()
    },
    dashboard: {
      desc: 'View status of all jobs',
      action: _dashboard()
    },
    discover: {
      desc: 'Discover Jenkins instance running on a specified host',
      action: _discover()
    },
    executor: {
      desc: 'View executors\' status (running builds)',
      action: _executor()
    },
    job: {
      desc: 'View job status reports',
      action: _job()
    },
    queue: {
      desc: 'View queued jobs',
      action: _queue()
    },
    ver: {
      desc: 'View Jenkins version number',
      action: _version()
    }
  };

  bag.cli.parse(commands, __dirname);
}

exports.exec = exec;