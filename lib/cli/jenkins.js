"use strict";
import _ from 'lodash';
import cli from 'bagofcli';
import Jenkins from '../jenkins.js';
import util from './util.js';

/**
 * Get a handler that calls Jenkins API to get a list of all jobs on the Jenkins instance.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function dashboard(cb) {
  return function (command) {
    function resultCb(result) {
      const jobs = result.jobs;
      if (_.isEmpty(jobs)) {
        console.log('Jobless Jenkins');
      } else {
        jobs.forEach(function (job) {
          const status = util.statusByColor(job.color);
          const color  = util.colorByStatus(status, job.color);
          console.log(`${status[color]} - ${job.name}`);
        });
      }
    }
    function jenkinsCb(jenkins) {
      jenkins.info(cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to discover a Jenkins instance on specified host.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function discover(cb) {
  return function (command, args) {
    let host = _.get(args, '[0]');

    if (!host) {
      host = 'localhost';
    }

    function resultCb(result) {
      const version = result.hudson.version[0];
      const host = result.hudson.url && result.hudson.url[0] ? result.hudson.url[0] : host;
      console.log(`Jenkins ver. ${version} is running on ${host}`);
    }
    function jenkinsCb(jenkins) {
      jenkins.discover(host, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to display executors information per computer
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function executor(cb) {
  return function (command) {
    function resultCb(result) {

      const computers = result.computer;

      if (_.isEmpty(computers)) {
        console.log('No executor found');
      } else {

        const data = Jenkins.executorSummary(computers);

        _.keys(data).forEach(function (computer) {
          console.log('+ %s | %s', computer, data[computer].summary);
          data[computer].executors.forEach(function (executor) {
            if (!executor.idle) {
              console.log('  - %s | %s%%s', executor.name, executor.progress, (executor.stuck) ? ' stuck!' : '');
            }
          });
        });

      }
    }
    function jenkinsCb(jenkins) {
      jenkins.computer(cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
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
  return function (command) {
    function resultCb(result) {
      result.items.forEach(function (article) {
        console.log(article.title);
      });
    }
    function jenkinsCb(jenkins) {
      if (command.job) {
        jenkins.parseJobFeed(command.job, cli.exitCb(null, resultCb));
      } else if (command.view) {
        jenkins.parseViewFeed(command.view, cli.exitCb(null, resultCb));
      } else {
        jenkins.parseFeed(cli.exitCb(null, resultCb));
      }
    }
    cb(command, jenkinsCb);
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
  return function (command) {
    function resultCb(result) {
      const items = result.items;
      if (_.isEmpty(items)) {
        console.log('Queue is empty');
      } else {
        items.forEach(function (item) {
            console.log('- %s', item.task.name);
        });
      }
    }
    function jenkinsCb(jenkins) {
      jenkins.queue(cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to read the Jenkins version.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function version(cb) {
  return function (command) {
    function resultCb(result) {
      console.log(`Jenkins ver. ${result}`);
    }
    function jenkinsCb(jenkins) {
      jenkins.version(cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

const exports = {
  dashboard: dashboard,
  discover: discover,
  executor: executor,
  feed: feed,
  queue: queue,
  version: version
};

export {
  exports as default
};