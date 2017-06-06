var _        = require('lodash');
var feedRead = require('feed-read');

/**
 * Create a view with specified configuration.
 *
 * @param {String} name: Jenkins view name
 * @param {String} config: Jenkins view config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function create(name, config, cb) {
  var opts = {
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

  var url = this.url + '/view/' + name + '/rssAll';
  feedRead(url, cb);
}

exports.create      = create;
exports.read        = read;
exports.update      = update;
exports.fetchConfig = fetchConfig;
exports.parseFeed   = parseFeed;
