var buster  = require('buster-node');
var jenkins = require('../../lib/http/jenkins');
var referee = require('referee');
var req     = require('bagofrequest');
var text    = require('bagoftext');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('http - job', {
  setUp: function () {
    jenkins.url  = 'http://localhost:8080';
    jenkins.opts = { handlers: {} };
  },
  tearDown: function () {
    delete jenkins.opts;
  },
  'queue - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/queue/api/json');
      assert.defined(opts.handlers[200]);
      cb();
    });
    jenkins.queue(done);
  },
  'version - should pass version header value if exists': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'head');
      assert.equals(url, 'http://localhost:8080');
      assert.defined(opts.handlers[200]);

      var result = { headers: { 'x-jenkins': '1.2.3' }};
      opts.handlers[200](result, function (err, result) {
        assert.equals(err, null);
        assert.equals(result, '1.2.3');
        cb();
      });
    });
    jenkins.version(done);
  },
  'version - should pass error if version header value does not exist': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'head');
      assert.equals(url, 'http://localhost:8080');
      assert.defined(opts.handlers[200]);

      var result = { headers: {}};
      opts.handlers[200](result, function (err, result) {
        assert.equals(err.message, 'Not a Jenkins server');
        cb();
      });
    });
    jenkins.version(done);
  }
});