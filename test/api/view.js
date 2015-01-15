var buster  = require('buster-node');
var view    = require('../../lib/api/view');
var referee = require('referee');
var req     = require('bagofrequest');
var text    = require('bagoftext');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('http - view', {
  setUp: function () {
    view.url  = 'http://localhost:8080';
    view.opts = { handlers: {} };
  },
  tearDown: function () {
    delete view.opts;
  },
  'create - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/createView');
      assert.equals(opts.queryStrings.name, 'someview');
      assert.equals(opts.headers['content-type'], 'application/xml');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[400]);
      cb();
    });
    view.create('someview', '<xml>some config</xml>', done);
  },
  'update - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/view/someview/config.xml');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    view.update('someview', '<xml>some config</xml>', done);
  },
  'fetchConfig - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/view/someview/config.xml');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    view.fetchConfig('someview', done);
  }
});