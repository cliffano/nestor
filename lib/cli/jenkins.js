var _    = require('lodash');
var cli  = require('bagofcli');
var text = require('bagoftext');

/**
 * Get a handler that calls Jenkins API to create a view with specific configuration.
 * Success view creation message will be logged when there's no error.
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

exports.readQueue = readQueue;