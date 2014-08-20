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
  'readQueue - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/queue/api/json');
      assert.defined(opts.handlers[200]);
      cb();
    });
    jenkins.readQueue(done);
  }
});