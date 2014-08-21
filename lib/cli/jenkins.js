var _    = require('lodash');
var cli  = require('bagofcli');
var text = require('bagoftext');

/**
 * Get a handler that calls Jenkins API to read the queue.
 * Queue contains a list of jobs that are queued waiting for a free executor.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function readQueue(cb) {
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
      jenkins.readQueue(cli.exitCb(null, resultCb));
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

exports.readQueue   = readQueue;
exports.version = version;