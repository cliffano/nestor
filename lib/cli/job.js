"use strict";
import _ from 'lodash';
import cli from 'bagofcli';
import fs from 'fs';
import moment from 'moment';
import util from './util.js';
import _util from 'util';

/**
 * Get a handler that calls Jenkins API to create a job with specific configuration.
 * Success job creation message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function create(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');
    const configFile = _.get(args, '[1]');

    function resultCb(result) {
      console.log(`Job ${name} was created successfully`);
    }
    function jenkinsCb(jenkins) {
      const config = fs.readFileSync(configFile).toString();
      jenkins.createJob(name, config, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to retrieve information about a job.
 * Job status and health reports will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function read(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');

    function resultCb(result) {
      const status = util.statusByColor(result.color);
      const color  = util.colorByStatus(status, result.color);
      console.log(`${name} | ${status[color]}`);
      result.healthReport.forEach(function (report) {
        console.log(' - %s', report.description);
      });
    }
    function jenkinsCb(jenkins) {
      jenkins.readJob(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to retrieve information about the latest build of a job.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function readLatest(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');

    function resultCb(result) {

      let status;
      let color;
      let description;

      if (result.building) {
        status      = 'building';
        color       = util.colorByStatus(status);
        description = _util.format('Started %s', moment(result.timestamp).fromNow());
      } else {
        status      = result.result.toLowerCase();
        color       = util.colorByStatus(status);
        description = _util.format('Finished %s', moment(result.timestamp + result.duration).fromNow());
      }

      console.log(`${name} | ${status[color]}`);
      console.log(` - ${description}`);
    }

    function jenkinsCb(jenkins) {
      jenkins.readLatestJob(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to update a job with specific configuration.
 * Success job update message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function update(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');
    const configFile = _.get(args, '[1]');

    function resultCb(result) {
      console.log(`Job ${name} was updated successfully`);
    }
    function jenkinsCb(jenkins) {
      const config = fs.readFileSync(configFile).toString();
      jenkins.updateJob(name, config, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to delete a job.
 * Success job deletion message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function _delete(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');
    function resultCb(result) {
      console.log(`Job ${name} was deleted successfully`);
    }
    function jenkinsCb(jenkins) {
      jenkins.deleteJob(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to build a job.
 * Success job stopped message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function build(cb) {
  // params arg is a query string like param1=value1&param2=value2
  return function (command, args) {
    const name = _.get(args, '[0]');
    let paramsString = _.get(args, '[1]');

    if (!command) {
      command = paramsString;
      paramsString = null;
    }

    function resultCb(result) {
      console.log(`Job ${name} was triggered successfully`);
    }

    function jenkinsCb(jenkins) {

      // simply pass jenkins instance to the next callback
      function passThroughCb(command, jenkinsCb) {
        jenkinsCb(jenkins);
      }

      const params = {};
      if (paramsString) {
        paramsString.split('&').forEach(function (paramString) {
          const delim = paramString.indexOf('=');
          const key = paramString.substring(0, delim);
          const value = paramString.substring(delim + 1, paramString.length);
          params[key] = value;
        });
      }

      const jenkinsPollIntervalMillis = 2000;
      const jenkinsPollRetries = command.poll || 15;

      function streamIfReady(buildUrl, ready, retries) {
        if (ready) {
          _console(passThroughCb)(name, null, command);
        } else {
          if (retries > 0) {
            console.log('Waiting for job to start...');
            setTimeout(function () {
              jenkins.checkBuildStarted(buildUrl, function (ready) {
                streamIfReady(buildUrl, ready, retries - 1);
              });
            }, jenkinsPollIntervalMillis);
          } else {
            const waitTime = (jenkinsPollIntervalMillis * jenkinsPollRetries) / 1000;
            console.log(`Build didn't start after ${waitTime} seconds, it's still waiting in the queue`);
            cli.exit({}, null);
          }
        }
      }

      let cb;
      // with console enabled, display result and poll until the job starts, then stream console output
      if (command.console) {
        cb = function (err, result, response) {
          resultCb(response);
          const buildUrl = response.headers.location;
          setTimeout(function () {
            jenkins.checkBuildStarted(buildUrl, function (ready) {
              streamIfReady(buildUrl, ready, jenkinsPollRetries);
            });
          }, jenkinsPollIntervalMillis);
        };

      // with console disabled, display result
      } else {
        cb = cli.exitCb(null, resultCb);
      }

      jenkins.buildJob(name, params, cb);
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to stop a job.
 * Success job stopped message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function stop(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');

    function resultCb(result) {
      console.log(`Job ${name} was stopped successfully`);
    }
    function jenkinsCb(jenkins) {
      jenkins.stopJob(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to stream console output.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function _console(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');
    let buildNumber = _.get(args, '[1]');

    if (!command) {
      command = buildNumber;
      buildNumber = null;
    }

    function jenkinsCb(jenkins) {
      // console does not trigger any build, interval is set to 0 (no-pending delay time)
      const interval = 0;

      const stream = jenkins.streamJobConsole(name, buildNumber, interval, cli.exit);
      stream.pipe(process.stdout, { end: false });
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to enable a job.
 * Success job enabled message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function enable(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');

    function resultCb(result) {
      console.log(`Job ${name} was enabled successfully`);
    }
    function jenkinsCb(jenkins) {
      jenkins.enableJob(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to disable a job.
 * Success job disabled message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function disable(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');

    function resultCb(result) {
      console.log(`Job ${name} was disabled successfully`);
    }
    function jenkinsCb(jenkins) {
      jenkins.disableJob(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to copy a job into a new job.
 * Success job copy message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function copy(cb) {
  return function (command, args) {
    const existingName = _.get(args, '[0]');
    const newName = _.get(args, '[1]');
    
    function resultCb(result) {
      console.log(`Job ${existingName} was copied to job ${newName}`);
    }
    function jenkinsCb(jenkins) {
      jenkins.copyJob(existingName, newName, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to fetch a job configuration.
 * Jenkins job config.xml will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function fetchConfig(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');

    function resultCb(result) {
      console.log(result);
    }
    function jenkinsCb(jenkins) {
      jenkins.fetchJobConfig(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
  };
}

const exports = {
  create: create,
  read: read,
  readLatest: readLatest,
  update: update,
  delete: _delete,
  build: build,
  stop: stop,
  console: _console,
  enable: enable,
  disable: disable,
  copy: copy,
  fetchConfig: fetchConfig
};

export {
  exports as default
};
