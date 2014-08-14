var req  = require('bagofrequest');
var util = require('./util');

/**
 * Create a job with specified configuration.
 *
 * @param {String} name: Jenkins job name
 * @param {String} config: Jenkins job config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function create(name, config, cb) {

  this.opts.queryStrings = { name: name };
  this.opts.headers      = { 'content-type': 'application/xml' };
  this.opts.body         = config;

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[400] = util.htmlError; 

  req.request('post', this.url + '/createItem/api/json', this.opts, cb);
}

/**
 * Retrieve information about a job.
 * Information contains job status and reports among other things.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function read(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  req.request('get', this.url + '/job/' + name + '/api/json', this.opts, cb);
}

/**
 * Update a job with specified configuration
 *
 * @param {String} name: Jenkins job name
 * @param {String} config: Jenkins job config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function update(name, config, cb) {

  this.opts.body = config;

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  req.request('post', this.url + '/job/' + name + '/config.xml', this.opts, cb);
}

/**
 * Delete a job.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function _delete(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  req.request('post', this.url + '/job/' + name + '/doDelete', this.opts, cb);
}

/**
 * Enable a job.
 * If job was disabled, then it will be enabled.
 * If job was already enabled, then it will stay as-is, no error.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function enable(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  req.request('post', this.url + '/job/' + name + '/enable', this.opts, cb);
}

/**
 * Disable a job.
 * If job was enabled, then it will be disabled.
 * If job was already disabled, then it will stay as-is, no error.
 *
 * @param {String} jobName: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function disable(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  req.request('post', this.url + '/job/' + name + '/disable', this.opts, cb);
}

/**
 * Copy an existing job into a new job.
 *
 * @param {String} existingName: existing Jenkins job name to copy from
 * @param {String} newName: new Jenkins job name to copy to
 * @param {Function} cb: standard cb(err, result) callback
 */
function copy(existingName, newName, cb) {

  this.opts.queryStrings = { name: newName, mode: 'copy', from: existingName };
  this.opts.headers      = { 'content-type': 'text/plain' };

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[400] = util.htmlError; 

  req.request('post', this.url + '/createItem', this.opts, cb);
}

/**
 * Fetch a job configuration.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function fetchConfig(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  req.request('get', this.url + '/job/' + name + '/config.xml', this.opts, cb);
}

exports.create      = create;
exports.read        = read;
exports.update      = update;
exports.delete      = _delete;
exports.enable      = enable;
exports.disable     = disable;
exports.copy        = copy;
exports.fetchConfig = fetchConfig;