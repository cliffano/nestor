var buster     = require('buster-node');
var dgram      = require('dgram');
var feedRead   = require('feed-read');
var jenkins    = require('../../lib/api/jenkins');
var proxyquire = require('proxyquire');
var referee    = require('referee');
var Swaggy     = require('swaggy-jenkins');
var text       = require('bagoftext');
var assert     = referee.assert;

text.setLocale('en');

buster.testCase('api - jenkins', {
  setUp: function () {
    this.mockFeedRead = this.mock(feedRead);

    jenkins.url  = 'http://localhost:8080';
    jenkins.opts = { handlers: {} };
    jenkins.remoteAccessApi = new Swaggy.RemoteAccessApi();

    this.mockTimer = this.useFakeTimers();
    this.mock({});
  },
  tearDown: function () {
    delete jenkins.opts;
  },
  'computer - should delegate to Swaggy getComputer': function (done) {
    this.stub(jenkins.remoteAccessApi, 'getComputer', function (depth, cb) {
      assert.equals(depth, 1);
      cb();
    });
    jenkins.computer(done);
  },
  'crumb - should delegate to Swaggy getCrumb': function (done) {
    this.stub(jenkins.remoteAccessApi, 'getCrumb', function (cb) {
      cb();
    });
    jenkins.crumb(done);
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
  'info - should delegate to Swaggy getJenkins': function (done) {
    this.stub(jenkins.remoteAccessApi, 'getJenkins', function (cb) {
      cb();
    });
    jenkins.info(done);
  },
  'parseFeed - should parse feed from API endpoint': function (done) {
    var mockFeedRead = function (url, cb) {
      assert.equals(url, 'http://localhost:8080/rssAll');
      cb();
    };
    var job = proxyquire('../../lib/api/jenkins.js', { 'feed-read': mockFeedRead });
    jenkins.parseFeed(done);
  },
  'queue - should delegate to Swaggy getQueue': function (done) {
    this.stub(jenkins.remoteAccessApi, 'getQueue', function (cb) {
      cb();
    });
    jenkins.queue(done);
  },
  'version - should pass version header value if exists': function (done) {
    this.stub(jenkins.remoteAccessApi, 'headJenkins', function (cb) {
      var response = { headers: { 'x-jenkins': '1.2.3' }};
      cb(null, null, response);
    });
    jenkins.version(function (err, result) {
      assert.equals(result, '1.2.3');
      done();
    });
  },
  'version - should pass error if version header value does not exist': function (done) {
    this.stub(jenkins.remoteAccessApi, 'headJenkins', function (cb) {
      var response = { headers: {}};
      cb(null, null, response);
    });
    jenkins.version(function (err, result) {
      assert.equals(err.message, 'Not a Jenkins server');
      done();
    });
  },
  'version - should pass error if an error occurrs': function (done) {
    this.stub(jenkins.remoteAccessApi, 'headJenkins', function (cb) {
      cb(new Error('some error'));
    });
    jenkins.version(function (err, result) {
      assert.equals(err.message, 'some error');
      done();
    });
  }
});
