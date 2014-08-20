var req  = require('bagofrequest');
var util = require('./util');

/**
 * Retrieve a list of jobs in the queue waiting for available
 * executor or for a previously running build of the same job
 * to finish.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function readQueue(cb) {

  this.opts.handlers[200] = util.passThroughSuccess;

  req.request('get', this.url + '/queue/api/json', this.opts, cb);
}

exports.readQueue = readQueue;