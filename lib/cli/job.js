var cli  = require('bagofcli');
var fs   = require('fs');
var text = require('bagoftext');
var util = require('./util');

/**
 * Get a handler that calls Jenkins API to create a job with specific configuration.
 * Success job creation message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function create(cb) {
  return function (name, configFile, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was created successfully'), name);
    }
    function jenkinsCb(jenkins) {
      var config = fs.readFileSync(configFile).toString();
      jenkins.createJob(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
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
  return function (name, args) {
    function resultCb(result) {
      var status = util.statusByColor(result.color);
      var color  = util.colorByStatus(status, result.color);
      console.log('%s | %s', name, text.__(status)[color]);
      result.healthReport.forEach(function (report) {
        console.log(' - %s', report.description);
      });
    }
    function jenkinsCb(jenkins) {
      jenkins.readJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
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
  return function (name, configFile, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was updated successfully'), name);
    }
    function jenkinsCb(jenkins) {
      var config = fs.readFileSync(configFile).toString();
      jenkins.updateJob(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
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
  return function (name, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was deleted successfully'), name);
    }
    function jenkinsCb(jenkins) {
      jenkins.deleteJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
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
  return function (name, paramsString, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was started successfully'), name);
    }
    function jenkinsCb(jenkins) {

      // simply pass jenkins instance to the next callback
      function passThroughCb(args, jenkinsCb) {
        jenkinsCb(jenkins);
      }

      if (!args) {
        args = paramsString;
        paramsString = null;
      }

      var params = {};
      if (paramsString) {
        paramsString.split('&').forEach(function (paramString) {
          var keyVal = paramString.split('=');
          params[keyVal[0]] = keyVal[1];
        });
      }

      var cb;
      // with console enabled, display result and sleep for 5 seconds then stream console output
      if (args.console) {
        cb = function (err, result) {
          resultCb(result);
          setTimeout(function () {
            _console(passThroughCb)(name, args);
          }, args.pending || 5000);
        };
      // with console disabled, display result
      } else {
        cb = cli.exitCb(null, resultCb);
      }

      jenkins.buildJob(name, params, cb);
    }
    cb(args, jenkinsCb);
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
  return function (name, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was stopped successfully'), name);
    }
    function jenkinsCb(jenkins) {
      jenkins.stopJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to stream console output.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function _console(cb) {
  return function (name, args) {
    function jenkinsCb(jenkins) {
      // console does not trigger any build, interval is set to 0 (no-pending delay time)
      var interval = 0;

      var stream = jenkins.streamJobConsole(name, interval, cli.exit);
      stream.pipe(process.stdout, { end: false });
    }
    cb(args, jenkinsCb);
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
  return function (name, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was enabled successfully'), name);
    }
    function jenkinsCb(jenkins) {
      jenkins.enableJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
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
  return function (name, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was disabled successfully'), name);
    }
    function jenkinsCb(jenkins) {
      jenkins.disableJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
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
  return function (existingName, newName, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was copied to job %s'), existingName, newName);
    }
    function jenkinsCb(jenkins) {
      jenkins.copyJob(existingName, newName, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
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
  return function (name, args) {
    function resultCb(result) {
      console.log(result);
    }
    function jenkinsCb(jenkins) {
      jenkins.fetchJobConfig(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

exports.create      = create;
exports.read        = read;
exports.update      = update;
exports.delete      = _delete;
exports.build       = build;
exports.stop        = stop;
exports.console     = _console;
exports.enable      = enable;
exports.disable     = disable;
exports.copy        = copy;
exports.fetchConfig = fetchConfig;