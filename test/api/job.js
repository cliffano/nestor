var buster  = require('buster-node');
var job     = require('../../lib/api/job');
var referee = require('referee');
var req     = require('bagofrequest');
var text    = require('bagoftext');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('http - job', {
  setUp: function () {
    job.url  = 'http://localhost:8080';
    job.opts = { handlers: {} };
  },
  tearDown: function () {
    delete job.opts;
  },
  'create - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/createItem/api/json');
      assert.equals(opts.queryStrings.name, 'somejob');
      assert.equals(opts.headers['content-type'], 'application/xml');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[400]);
      cb();
    });
    job.create('somejob', '<xml>some config</xml>', done);
  },
  'read - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/somejob/api/json');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.read('somejob', done);
  },
  'update - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/somejob/config.xml');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.update('somejob', '<xml>some config</xml>', done);
  },
  'delete - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/somejob/doDelete');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.delete('somejob', done);
  },
  'stop - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/somejob/lastBuild/stop');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.stop('somejob', done);
  },
  'enable - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/somejob/enable');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.enable('somejob', done);
  },
  'disable - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/somejob/disable');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.disable('somejob', done);
  },
  'copy - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/createItem');
      assert.equals(opts.queryStrings, { name: 'newjob', mode: 'copy', from: 'existingjob' });
      assert.equals(opts.headers, { 'content-type': 'text/plain' });
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[400]);
      cb();
    });
    job.copy('existingjob', 'newjob', done);
  },
  'fetchConfig - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/somejob/config.xml');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.fetchConfig('somejob', done);
  }
});