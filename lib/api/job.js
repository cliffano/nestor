var _             = require('lodash');
var async         = require('async');
var ConsoleStream = require('./consolestream');
var req           = require('bagofrequest');
var request       = require('request');
var util          = require('./util');

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

  this.opts.handlers[200] = util.passThroughSuccessJson;
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
 * Build a job.
 *
 * @param {String} name: Jenkins job name
 * @param {Object} params: build parameters key-value pairs
 * @param {Function} cb: standard cb(err, result) callback
 */
function build(name, params, cb) {

  var body = { parameter: [] } ;
  _.keys(params).forEach(function (key) {
    body.parameter.push({ name: key, value: params[key] });
  });

  this.opts.queryStrings = { token: 'nestor', json: JSON.stringify(body) };

  this.opts.handlers[200] = util.passThroughSuccess; // backward compatibility for old Jenkins versions
  this.opts.handlers[201] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);
  this.opts.handlers[405] = util.jobRequireParamsError(name); // backward compatibility for old Jenkins versions

  req.request('post', this.url + '/job/' + name + '/build', this.opts, cb);
}

/**
 * Stop a running/building job.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function stop(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  req.request('post', this.url + '/job/' + name + '/lastBuild/stop', this.opts, cb);
}

/**
 * Stream a Jenkins job console output (readable stream).
 * Jenkins uses the following headers:
 * - x-more-data to determine whether there are still more content coming through
 * - x-text-size to determine the starting point of progressive text output (this was obviously badly named, but stayed there for backward compatibility reason)
 *
 * @param {String} name: Jenkins job name
 * @param {Number} interval: interval between console requests in milliseconds
 * @param {Function} cb: standard cb(err, result) callback
 * @return {ConsoleStream} readable console output stream
 */
function streamConsole(name, interval, cb) {

  var stream = new ConsoleStream();
  var url    = this.url + '/job/' + name + '/lastBuild/logText/progressiveText';
  var self   = this;

  function _success(result, cb) {
    if (result.body) {
      stream.emit('data', result.body);
    }
    // stream while there are more data
    async.whilst(
      function () {
        return result.headers['x-more-data'] === 'true';
      },
      function (cb) {
        var params = {
          url: url,
          qs: { start: parseInt(result.headers['x-text-size'], 10) }
        };
        var envProxy = req.proxy(url);
        if (envProxy) {
          params.proxy = envProxy;
        }
        request.get(params, function (err, _result) {
          if (err) {
            cb(err);
          } else {
            result = _result;
            if (_result.body) {
              stream.emit('data', _result.body);
            }
            setTimeout(cb, interval);
          }
        });
      },
      function (err) {
        stream.emit('end');
        cb(err);
      }
    );
  }

  this.opts.queryStrings = { start: 0 }; // the first chunk

  this.opts.handlers[200] = _success;
  this.opts.handlers[404] = util.jobNotFoundError(name);

  process.nextTick(function () {
    req.request('get', url, self.opts, cb);
  });

  return stream;
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

exports.create        = create;
exports.read          = read;
exports.update        = update;
exports.delete        = _delete;
exports.build         = build;
exports.stop          = stop;
exports.streamConsole = streamConsole;
exports.enable        = enable;
exports.disable       = disable;
exports.copy          = copy;
exports.fetchConfig   = fetchConfig;