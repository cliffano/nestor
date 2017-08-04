var buster     = require('buster-node');
var feedRead   = require('feed-read');
var proxyquire = require('proxyquire');
var view       = require('../../lib/api/view');
var referee    = require('referee');
var Swaggy     = require('swaggy-jenkins');
var text       = require('bagoftext');
var assert     = referee.assert;

text.setLocale('en');

buster.testCase('api - view', {
  setUp: function () {
    view.url  = 'http://localhost:8080';
    view.opts = { handlers: {}, headers: { jenkinsCrumb: 'somecrumb' } };
    view.remoteAccessApi = new Swaggy.RemoteAccessApi();
    this.mock({});
  },
  tearDown: function () {
    delete view.opts;
  },
  'create - should send request to API endpoint': function (done) {
    this.stub(view.remoteAccessApi, 'postCreateView', function (name, opts, cb) {
      assert.equals(name, 'someview');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.equals(opts.contentType, 'application/xml');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    view.create('someview', '<xml>some config</xml>', done);
  },
  'read - should send request to API endpoint': function (done) {
    this.stub(view.remoteAccessApi, 'getView', function (name, cb) {
      assert.equals(name, 'someview');
      cb();
    });
    view.read('someview', done);
  },
  'update - should send request to API endpoint': function (done) {
    this.stub(view.remoteAccessApi, 'postViewConfig', function (name, body, opts, cb) {
      assert.equals(name, 'someview');
      assert.equals(body, '<xml>some config</xml>');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    view.update('someview', '<xml>some config</xml>', done);
  },
  'fetchConfig - should send request to API endpoint': function (done) {
    this.stub(view.remoteAccessApi, 'getViewConfig', function (name, cb) {
      assert.equals(name, 'someview');
      cb();
    });
    view.fetchConfig('someview', done);
  },
  'parseFeed - should parse feed from API endpoint': function (done) {
    var mockFeedRead = function (url, cb) {
      assert.equals(url, 'http://localhost:8080/view/someview/rssAll');
      cb();
    };
    var view = proxyquire('../../lib/api/view.js', { 'feed-read': mockFeedRead });
    view.url  = 'http://localhost:8080';
    view.parseFeed('someview', done);
  }
});
