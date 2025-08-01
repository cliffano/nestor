"use strict";
import _ from 'lodash';
import cli from 'bagofcli';
import Jenkins from '../jenkins.js';
import text from 'bagoftext';
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
        console.log(text.__('Jobless Jenkins'));
      } else {
        jobs.forEach(function (job) {
          const status = util.statusByColor(job.color);
          const color  = util.colorByStatus(status, job.color);
          console.log('%s - %s', text.__(status)[color], job.name);
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
  return function (command, host) {
    if (!host) {
      host = 'localhost';
    } else if (Array.isArray(host)) {
      host = host[0];
    }
    function resultCb(result) {
      console.log(text.__('Jenkins ver. %s is running on %s'),
          result.hudson.version[0],
          (result.hudson.url && result.hudson.url[0]) ? result.hudson.url[0] : host);
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
        console.log(text.__('No executor found'));
      } else {

        const data = Jenkins.executorSummary(computers);

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
      console.log(text.__('Jenkins ver. %s', result));
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