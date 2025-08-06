"use strict";
import dgram from 'dgram';
import RssParser from 'rss-parser';
import xml2js from 'xml2js';

/**
 * Retrieve Jenkins instance computer information.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function computer(cb) {
  const depth = 1;
  this.remoteAccessApi.getComputer(depth, cb);
}

/**
 * Retrieve Jenkins crumb, this is needed when sending POST requests to a Jenkins
 * instance with CSRF protection.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function crumb(cb) {
  this.baseApi.getCrumb(cb);
}

/**
 * Discover whether there's a Jenkins instance running on the specified host.
 *
 * @param {String} host: hostname
 * @param {Function} cb: standard cb(err, result) callback
 */
function discover(host, cb) {

  const TIMEOUT = 5000;

  const socket = dgram.createSocket('udp4');
  const buffer = new Buffer('Long live Jenkins!');
  const parser = new xml2js.Parser();

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
    cb(new Error(`Unable to find any Jenkins instance on ${host}`));
  }, TIMEOUT);
}

/**
 * Retrieve Jenkins instance information.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function info(cb) {
  this.remoteAccessApi.getJenkins(cb);
}

/**
 * Parse Jenkins instance feed (all jobs).
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function parseFeed(cb) {
  const url = this.url + '/rssAll';
  new RssParser().parseURL(url, cb);
}

/**
 * Retrieve a list of jobs in the queue waiting for available
 * executor or for a previously running build of the same job
 * to finish.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function queue(cb) {
  this.remoteAccessApi.getQueue(cb);
}

/**
 * Retrieve Jenkins version number from x-jenkins header.
 * If x-jenkins header does not exist, then it's assumed that the server is not a Jenkins instance.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function version(cb) {

  function _cb(err, result, response) {
    if (err) {
      cb(err);
    } else if (response.headers['x-jenkins']) {
      cb(null, response.headers['x-jenkins']);
    } else {
      cb(new Error('Not a Jenkins server'));
    }
  }
  this.remoteAccessApi.headJenkins(_cb);
}

const exports = {
  computer: computer,
  crumb: crumb,
  discover: discover,
  info: info,
  parseFeed: parseFeed,
  queue: queue,
  version: version
};

export {
  exports as default
};