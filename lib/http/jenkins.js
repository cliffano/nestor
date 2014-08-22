var req  = require('bagofrequest');
var text = require('bagoftext');
var util = require('./util');

/**
 * Retrieve a list of jobs in the queue waiting for available
 * executor or for a previously running build of the same job
 * to finish.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function queue(cb) {

  this.opts.handlers[200] = util.passThroughSuccess;

  req.request('get', this.url + '/queue/api/json', this.opts, cb);
}

/**
 * Retrieve Jenkins version number from x-jenkins header.
 * If x-jenkins header does not exist, then it's assumed that the server is not a Jenkins instance.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function version(cb) {

  function _success(result, cb) {
    if (result.headers['x-jenkins']) {
      cb(null, result.headers['x-jenkins']);
    } else {
      cb(new Error(text.__('Not a Jenkins server')));
    }
  }

  this.opts.handlers[200] = _success;

  req.request('head', this.url, this.opts, cb);
}

exports.queue   = queue;
exports.version = version;