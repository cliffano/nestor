var _    = require('lodash');
var cli  = require('bagofcli');
var text = require('bagoftext');

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
 * Get a handler that calls Jenkins API to read the queue.
 * Queue contains a list of jobs that are queued waiting for a free executor.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function queue(cb) {
  return function (args) {
    function resultCb(result) {
      var items = JSON.parse(result).items;
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

exports.discover = discover;
exports.queue    = queue;
exports.version  = version;