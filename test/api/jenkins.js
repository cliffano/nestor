var buster  = require('buster-node');
var dgram   = require('dgram');
var jenkins = require('../../lib/api/jenkins');
var referee = require('referee');
var req     = require('bagofrequest');
var text    = require('bagoftext');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('http - jenkins', {
  setUp: function () {
    jenkins.url  = 'http://localhost:8080';
    jenkins.opts = { handlers: {} };

    this.mockTimer = this.useFakeTimers();
  },
  tearDown: function () {
    delete jenkins.opts;
  },
  'discover - should close socket and pass error to callback when socket emits error event': function (done) {
    var closeCallCount = 0,
      mockSocket = {
        close: function () {
          closeCallCount++;
        },
        on: function (event, cb) {
          if (event === 'error') {
            cb(new Error('someerror'));
          }
        },
        send:  function (buf, offset, length, port, address, cb) {}
      };
    this.stub(dgram, 'createSocket', function (type) {
      assert.equals(type, 'udp4');
      return mockSocket;
    });
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'someerror');
      assert.equals(result, undefined);
      done();
    });
    assert.equals(closeCallCount, 1);
  },
  'discover - should close socket and pass error to callback when an error occurs while sending a message': function (done) {
    var closeCallCount = 0,
      mockSocket = {
        close: function () {
          closeCallCount++;
        },
        on: function (event, cb) {},
        send:  function (buf, offset, length, port, address, cb) {
          assert.equals(buf.toString(), 'Long live Jenkins!');
          assert.equals(offset, 0);
          assert.equals(length, 18);
          assert.equals(port, 33848);
          assert.equals(address, 'somehost');
          cb(new Error('someerror'));
        }
      };
    this.stub(dgram, 'createSocket', function (type) {
      assert.equals(type, 'udp4');
      return mockSocket;
    });
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'someerror');
      assert.equals(result, undefined);
      done();
    });
    assert.equals(closeCallCount, 1);
  },
  'discover - should close socket and pass result to callback when socket emits message event': function (done) {
    var closeCallCount = 0,
      mockSocket = {
        close: function () {
          closeCallCount++;
        },
        on: function (event, cb) {
          if (event === 'message') {
            cb('<hudson><version>1.431</version><url>http://localhost:8080/</url><server-id>362f249fc053c1ede86a218587d100ce</server-id><slave-port>55328</slave-port></hudson>');
          }
        },
        send:  function (buf, offset, length, port, address, cb) { cb(); }
      };
    this.stub(dgram, 'createSocket', function (type) {
      assert.equals(type, 'udp4');
      return mockSocket;
    });
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err, null);
      assert.equals(result.hudson['server-id'][0], '362f249fc053c1ede86a218587d100ce');
      assert.equals(result.hudson['slave-port'][0], '55328');
      assert.equals(result.hudson.url[0], 'http://localhost:8080/');
      assert.equals(result.hudson.version[0], '1.431');
      done();
    });
    assert.equals(closeCallCount, 1);
  },
  'discover - should timeout and pass error when no instance is discovered': function (done) {
    var mockSocket = {
        close: function () {},
        on: function (event, cb) {},
        send:  function (buf, offset, length, port, address, cb) {}
      };
    this.stub(dgram, 'createSocket', function (type) {
      assert.equals(type, 'udp4');
      return mockSocket;
    });
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'Unable to find any Jenkins instance on somehost');
      assert.equals(result, undefined);
      done();
    });
    this.mockTimer.tick(5000);
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