var feedparser = require('feedparser');
var req        = require('bagofrequest');
var util       = require('./util');

/**
 * Create a view with specified configuration.
 *
 * @param {String} name: Jenkins view name
 * @param {String} config: Jenkins view config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function create(name, config, cb) {

  this.opts.queryStrings = { name: name };
  this.opts.headers      = { 'content-type': 'application/xml' };
  this.opts.body         = config;

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[400] = util.htmlError; 

  req.request('post', this.url + '/createView', this.opts, cb);  
}

/**
 * Retrieve information about a view.
 *
 * @param {String} name: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
function read(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccessJson;

  req.request('get', this.url + '/view/' + name + '/api/json', this.opts, cb);
}

/**
 * Update a view with specified configuration
 *
 * @param {String} name: Jenkins view name
 * @param {String} config: Jenkins view config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function update(name, config, cb) {

  this.opts.body = config;

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.viewNotFoundError(name);

  req.request('post', this.url + '/view/' + name + '/config.xml', this.opts, cb);
}

/**
 * Fetch a view configuration.
 *
 * @param {String} name: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
function fetchConfig(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.viewNotFoundError(name);

  req.request('get', this.url + '/view/' + name + '/config.xml', this.opts, cb);
}

/**
 * Parse view feed.
 *
 * @param {String} name: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
function parseFeed(name, cb) {

  var url = this.url + '/view/' + name + '/rssAll';
  feedparser.parseUrl(url, function (err, meta, articles) {
    cb(err, articles);
  });
}

exports.create      = create;
exports.read        = read;
exports.update      = update;
exports.fetchConfig = fetchConfig;
exports.parseFeed   = parseFeed;