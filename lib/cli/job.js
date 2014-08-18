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
      var data   = JSON.parse(result.body);
      var status = util.statusByColor(data.color) || 'UNKNOWN';
      var color  = status[data.color] ? data.color : 'grey';
      console.log('%s | %s', name, status[color]);
      data.healthReport.forEach(function (report) {
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
exports.stop        = stop;
exports.enable      = enable;
exports.disable     = disable;
exports.copy        = copy;
exports.fetchConfig = fetchConfig;