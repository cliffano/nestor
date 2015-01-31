var _       = require('lodash');
var cli     = require('bagofcli');
var Jenkins = require('../jenkins');
var text    = require('bagoftext');
var util    = require('./util');

/**
 * Get a handler that calls Jenkins API to get a list of all jobs on the Jenkins instance.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function dashboard(cb) {
  return function (args) {
    function resultCb(result) {
      var jobs = result.jobs;
      if (_.isEmpty(jobs)) {
        console.log(text.__('Jobless Jenkins'));
      } else {
        jobs.forEach(function (job) {
          var status = util.statusByColor(job.color);
          var color  = util.colorByStatus(status, job.color);
          console.log('%s - %s', text.__(status)[color], job.name);
        });
      }
    }
    function jenkinsCb(jenkins) {
      jenkins.info(cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to discover a Jenkins instance on specified host.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function discover(cb) {
  return function (host, args) {
    if (!args) {
      args = host || {};
      host = 'localhost';
    }
    function resultCb(result) {
      console.log(text.__('Jenkins ver. %s is running on %s'),
          result.hudson.version[0],
          (result.hudson.url && result.hudson.url[0]) ? result.hudson.url[0] : host);
    }
    function jenkinsCb(jenkins) {
      jenkins.discover(host, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to display executors information per computer
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function executor(cb) {
  return function (args) {
    function resultCb(result) {

      var computers = result.computer;

      if (_.isEmpty(computers)) {
        console.log(text.__('No executor found'));
      } else {

        var data = Jenkins.executorSummary(computers);

        _.keys(data).forEach(function (computer) {
          console.log('+ %s | %s', computer, data[computer].summary);
          data[computer].executors.forEach(function (executor) {
            if (!executor.idle) {
              console.log('  - %s | %s%%s', executor.name, executor.progress, (executor.stuck) ? text.__(' stuck!') : '');
            }
          });
        });

      }
    }
    function jenkinsCb(jenkins) {
      jenkins.computer(cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to retrieve feed.
 * Feed contains articles.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function feed(cb) {
  return function (args) {
    function resultCb(result) {
      result.forEach(function (article) {
        console.log(article.title);
      });
    }
    function jenkinsCb(jenkins) {
      if (args.job) {
        jenkins.parseJobFeed(args.job, cli.exitCb(null, resultCb));
      } else if (args.view) {
        jenkins.parseViewFeed(args.view, cli.exitCb(null, resultCb));
      } else {
        jenkins.parseFeed(cli.exitCb(null, resultCb));
      }
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to read the queue.
 * Queue contains a list of jobs that are queued waiting for a free executor.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function queue(cb) {
  return function (args) {
    function resultCb(result) {
      var items = result.items;
      if (_.isEmpty(items)) {
        console.log(text.__('Queue is empty'));
      } else {
        items.forEach(function (item) {
            console.log('- %s', item.task.name);
        });        
      }
    }
    function jenkinsCb(jenkins) {
      jenkins.queue(cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to read the Jenkins version.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function version(cb) {
  return function (args) {
    function resultCb(result) {
      console.log(text.__('Jenkins ver. %s', result));
    }
    function jenkinsCb(jenkins) {
      jenkins.version(cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

exports.dashboard = dashboard;
exports.discover  = discover;
exports.executor  = executor;
exports.feed      = feed;
exports.queue     = queue;
exports.version   = version;