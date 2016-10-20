var dgram    = require('dgram');
var feedRead = require('feed-read');
var req      = require('bagofrequest');
var text     = require('bagoftext');
var util     = require('./util');
var xml2js   = require('xml2js');

/**
 * Retrieve Jenkins instance computer information.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function computer(cb) {

  this.opts.queryStrings = { depth: 1 };

  this.opts.handlers[200] = util.passThroughSuccessJson;

  req.request('get', this.url + '/computer/api/json', this.opts, cb);
}

/**
 * Retrieve Jenkins crumb, this is needed when sending POST requests to a Jenkins
 * instance with CSRF protection.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function crumb(cb) {

  this.opts.handlers[200] = util.passThroughSuccessJson;

  req.request('get', this.url + '/crumbIssuer/api/json', this.opts, cb);
}

/**
 * Discover whether there's a Jenkins instance running on the specified host.
 *
 * @param {String} host: hostname
 * @param {Function} cb: standard cb(err, result) callback
 */
function discover(host, cb) {

  const TIMEOUT = 5000;

  var socket = dgram.createSocket('udp4');
  var buffer = new Buffer(text.__('Long live Jenkins!'));
  var parser = new xml2js.Parser();

  socket.on('error', function (err) {
    socket.close();
    cb(err);
  });

  socket.on('message', function (result) {
    socket.close();
    parser.addListener('end', function (result) {
      cb(null, result);
    });
    parser.parseString(result);
  });

  socket.send(buffer, 0, buffer.length, 33848, host, function (err, result) {
    if (err) {
      socket.close();
      cb(err);
    }
  });

  setTimeout(function () {
    cb(new Error(text.__('Unable to find any Jenkins instance on %s', host)));
  }, TIMEOUT);
}

/**
 * Retrieve Jenkins instance information.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function info(cb) {

  this.opts.handlers[200] = util.passThroughSuccessJson;

  req.request('get', this.url + '/api/json', this.opts, cb);
}

/**
 * Parse Jenkins instance feed (all jobs).
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function parseFeed(cb) {

  var url = this.url + '/rssAll';
  feedRead(url, cb);
}

/**
 * Retrieve a list of jobs in the queue waiting for available
 * executor or for a previously running build of the same job
 * to finish.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function queue(cb) {

  this.opts.handlers[200] = util.passThroughSuccessJson;

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

exports.computer  = computer;
exports.crumb     = crumb;
exports.discover  = discover;
exports.info      = info;
exports.parseFeed = parseFeed;
exports.queue     = queue;
exports.version   = version;
