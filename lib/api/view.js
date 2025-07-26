"use strict";
import _ from 'lodash';
import RssParser from 'rss-parser';

/**
 * Create a view with specified configuration.
 *
 * @param {String} name: Jenkins view name
 * @param {String} config: Jenkins view config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function create(name, config, cb) {
  const opts = {
    body: config,
    contentType: 'application/xml',
  };
  this.remoteAccessApi.postCreateView(name, _.merge(opts, this.opts.headers), cb);
}

/**
 * Retrieve information about a view.
 *
 * @param {String} name: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
function read(name, cb) {
  this.remoteAccessApi.getView(name, cb);
}

/**
 * Update a view with specified configuration
 *
 * @param {String} name: Jenkins view name
 * @param {String} config: Jenkins view config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function update(name, config, cb) {
  this.remoteAccessApi.postViewConfig(name, config, this.opts.headers, cb);
}

/**
 * Fetch a view configuration.
 *
 * @param {String} name: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
function fetchConfig(name, cb) {
  this.remoteAccessApi.getViewConfig(name, cb);
}

/**
 * Parse view feed.
 *
 * @param {String} name: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
function parseFeed(name, cb) {
  const url = this.url + '/view/' + name + '/rssAll';
  new RssParser().parseURL(url, cb);
}

const exports = {
  create: create,
  read: read,
  update: update,
  fetchConfig: fetchConfig,
  parseFeed: parseFeed
};

export {
  exports as default
};