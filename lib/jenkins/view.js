var req  = require('bagofrequest');
var util = require('./util');

function create(name, config, cb) {

  this.opts.queryStrings = { name: name };
  this.opts.headers      = { 'content-type': 'application/xml' };
  this.opts.body         = config;

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[400] = util.htmlError; 

  req.request('post', this.url + '/createView', this.opts, cb);  
}

function update(name, config, cb) {

  this.opts.body = config;

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.viewNotFoundError(name);

  req.request('post', this.url + '/view/' + name + '/config.xml', this.opts, cb);
}

function fetchConfig(name, cb) {

  this.opts.handlers[200] = util.passThroughSuccess;
  this.opts.handlers[404] = util.viewNotFoundError(name);

  req.request('get', this.url + '/view/' + name + '/config.xml', this.opts, cb);
}

exports.create      = create;
exports.update      = update;
exports.fetchConfig = fetchConfig;