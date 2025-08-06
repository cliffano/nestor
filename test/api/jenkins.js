"use strict";
/* eslint no-unused-vars: 0 */
import dgram from 'dgram';
import jenkins from '../../lib/api/jenkins.js';
import referee from '@sinonjs/referee';
import RssParser from 'rss-parser';
import sinon from 'sinon';
import Swaggy from 'swaggy-jenkins';
const assert = referee.assert;

describe('api - jenkins', function() {
  beforeEach(function (done) {
    jenkins.url  = 'http://localhost:8080';
    jenkins.opts = { handlers: {} };
    jenkins.remoteAccessApi = new Swaggy.RemoteAccessApi();
    jenkins.baseApi = new Swaggy.BaseApi();

    this.mockTimer = sinon.useFakeTimers();
    done();
  });
  afterEach(function (done) {
    sinon.restore();
    delete jenkins.opts;
    done();
  });
  it('computer - should delegate to Swaggy getComputer',function (done) {
    sinon.stub(jenkins.remoteAccessApi, 'getComputer').value(function (depth, cb) {
      assert.equals(depth, 1);
      cb();
    });
    jenkins.computer(done);
  });
  it('crumb - should delegate to Swaggy getCrumb', function (done) {
    sinon.stub(jenkins.baseApi, 'getCrumb').value(function (cb) {
      cb();
    });
    jenkins.crumb(done);
  });
  it('discover - should close socket and pass error to callback when socket emits error event', function (done) {
    let closeCallCount = 0;
    const mockSocket = {
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
    sinon.stub(dgram, 'createSocket').value(function (type) {
      assert.equals(type, 'udp4');
      return mockSocket;
    });
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'someerror');
      assert.isUndefined(result);
      done();
    });
    assert.equals(closeCallCount, 1);
  });
  it('discover - should close socket and pass error to callback when an error occurs while sending a message', function (done) {
    let closeCallCount = 0;
    const mockSocket = {
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
    sinon.stub(dgram, 'createSocket').value(function (type) {
      assert.equals(type, 'udp4');
      return mockSocket;
    });
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'someerror');
      assert.isUndefined(result);
      done();
    });
    assert.equals(closeCallCount, 1);
  });
  it('discover - should close socket and pass result to callback when socket emits message event', function (done) {
    let closeCallCount = 0;
    const mockSocket = {
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
    sinon.stub(dgram, 'createSocket').value(function (type) {
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
  });
  it('discover - should timeout and pass error when no instance is discovered', function (done) {
    const mockSocket = {
        close: function () {},
        on: function (event, cb) {},
        send:  function (buf, offset, length, port, address, cb) {}
      };
    sinon.stub(dgram, 'createSocket').value(function (type) {
      assert.equals(type, 'udp4');
      return mockSocket;
    });
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'Unable to find any Jenkins instance on somehost');
      assert.isUndefined(result);
      done();
    });
    this.mockTimer.tick(5000);
  });
  it('info - should delegate to Swaggy getJenkins', function (done) {
    sinon.stub(jenkins.remoteAccessApi, 'getJenkins').value(function (cb) {
      cb();
    });
    jenkins.info(done);
  });
  it('parseFeed - should parse feed from API endpoint', function (done) {
    sinon.stub(RssParser.prototype, 'parseURL').value(function (url, cb) {
      assert.equals(url, 'http://localhost:8080/rssAll');
      cb();
    });
    jenkins.parseFeed(done);
  });
  it('queue - should delegate to Swaggy getQueue', function (done) {
    sinon.stub(jenkins.remoteAccessApi, 'getQueue').value(function (cb) {
      cb();
    });
    jenkins.queue(done);
  });
  it('version - should pass version header value if exists', function (done) {
    sinon.stub(jenkins.remoteAccessApi, 'headJenkins').value(function (cb) {
      const response = { headers: { 'x-jenkins': '1.2.3' }};
      cb(null, null, response);
    });
    jenkins.version(function (err, result) {
      assert.equals(result, '1.2.3');
      done();
    });
  });
  it('version - should pass error if version header value does not exist', function (done) {
    sinon.stub(jenkins.remoteAccessApi, 'headJenkins').value(function (cb) {
      const response = { headers: {}};
      cb(null, null, response);
    });
    jenkins.version(function (err, result) {
      assert.equals(err.message, 'Not a Jenkins server');
      done();
    });
  });
  it('version - should pass error if an error occurrs', function (done) {
    sinon.stub(jenkins.remoteAccessApi, 'headJenkins').value(function (cb) {
      cb(new Error('some error'));
    });
    jenkins.version(function (err, result) {
      assert.equals(err.message, 'some error');
      done();
    });
  });
});
