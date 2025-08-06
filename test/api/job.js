"use strict";
/* eslint no-unused-vars: 0 */
import ConsoleStream from '../../lib/api/consolestream.js';
import job from '../../lib/api/job.js';
import referee from '@sinonjs/referee';
import RssParser from 'rss-parser';
import sinon from 'sinon';
import Swaggy from 'swaggy-jenkins';

const assert = referee.assert;

describe('api - job', function() {
  beforeEach(function (done) {
    job.url = 'http://localhost:8080';
    job.opts = { handlers: {}, headers: { jenkinsCrumb: 'somecrumb' } };
    job.remoteAccessApi = new Swaggy.RemoteAccessApi();
    done();
  });
  afterEach(function (done) {
    sinon.restore();
    delete job.opts;
    done();
  });
  it('create - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'postCreateItem').value(function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.equals(opts.contentType, 'application/xml');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.create('somejob', '<xml>some config</xml>', done);
  });
  it('read - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'getJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });
    job.read('somejob', done);
  });
  it('readLatest - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'getJobLastBuild').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });
    job.readLatest('somejob', done);
  });
  it('update - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'postJobConfig').value(function (name, body, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(body, '<xml>some config</xml>');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.update('somejob', '<xml>some config</xml>', done);
  });
  it('delete - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'postJobDelete').value(function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.delete('somejob', done);
  });
  it('stop - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'postJobLastBuildStop').value(function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.stop('somejob', done);
  });
  it('build - should send request to API endpoint without parameters when not supplied', function (done) {
    sinon.stub(job.remoteAccessApi, 'postJobBuild').value(function (name, body, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(body, '{"parameter":[]}');
      assert.equals(opts.token, 'nestor');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.build('somejob', {}, done);
  });
  it('build - should send request to API endpoint with parameters when supplied', function (done) {
    sinon.stub(job.remoteAccessApi, 'postJobBuild').value(function (name, body, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(body, '{"parameter":[{"name":"someparam1","value":"somevalue1"},{"name":"someparam2","value":"somevalue2"}]}');
      assert.equals(opts.token, 'nestor');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.build('somejob', { someparam1: 'somevalue1', someparam2: 'somevalue2' }, done);
  });
  it('checkStarted - returns true when build has an executable url', function (done) {
    const expectStarted = function(ready) {
      assert.equals(ready, true);
      done();
    };
    sinon.stub(job.remoteAccessApi, 'getQueueItem').value(function (number, cb) {
      assert.equals(number, '15032');
      cb(null, { _class: 'hudson.model.Queue$LeftItem' });
    });
    job.checkStarted('https://localhost:8080/queue/item/15032/', expectStarted);
  });
  it('checkStarted - returns false when build does not yet have an executable url', function (done) {
    const expectNotStarted = function(ready) {
      assert.equals(ready, false);
      done();
    };
    sinon.stub(job.remoteAccessApi, 'getQueueItem').value(function (number, cb) {
      assert.equals(number, '15032');
      cb(null, { _class: 'hudson.model.Queue$WaitingItem' });
    });
    job.checkStarted('https://localhost:8080/queue/item/15032/', expectNotStarted);
  });
  it('streamConsole - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'getJobProgressiveText').value(function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      assert.equals(start, 0);
      cb(null, null, { statusCode: 500 });
    });
    job.streamConsole('somejob', 123, 88000, done);
  });
  it('streamConsole - should display console output once when there is no more text', function (done) {
    sinon.stub(ConsoleStream.prototype, 'emit').value(function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.isUndefined(value);
      }
    });
    sinon.stub(job.remoteAccessApi, 'getJobProgressiveText').value(function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      if (start === 0) {
        cb(null, null, { statusCode: 200, text: 'Console output 1', headers: { 'x-more-data': 'true', 'x-text-size': 20 } });
      } else {
        assert.equals(start, 20);
        cb(null, null, { statusCode: 200, headers: { 'x-more-data': 'false', 'x-text-size': 20 } });
      }
    });
    job.streamConsole('somejob', 123, 0, done);
  });
  it('streamConsole - should display no console output once when result does not have any body', function (done) {
    sinon.stub(ConsoleStream.prototype, 'emit').value(function (event, value) {
      assert.isUndefined(value);
    });
    sinon.stub(job.remoteAccessApi, 'getJobProgressiveText').value(function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      cb(null, null, { statusCode: 200, headers: { 'x-more-data': 'false', 'x-text-size': 20 } });
    });
    job.streamConsole('somejob', 123, 0, done);
  });
  it('streamConsole - should display console output once when there is more text but an error occurs', function (done) {
    sinon.stub(ConsoleStream.prototype, 'emit').value(function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.isUndefined(value);
      }
    });
    sinon.stub(job.remoteAccessApi, 'getJobProgressiveText').value(function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      if (start === 0) {
        cb(null, null, { statusCode: 200, text: 'Console output 1', headers: { 'x-more-data': 'true', 'x-text-size': 20 } });
      } else {
        assert.equals(start, 20);
        cb(new Error('some error'), null, { headers: {} });
      }
    });
    job.streamConsole('somejob', 123, 0, done);
  });
  it('streamConsole - should display console output multiple times when there are more texts', function (done) {
    sinon.stub(ConsoleStream.prototype, 'emit').value(function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output');
      } else if (event === 'end') {
        assert.isUndefined(value);
      }
    });
    sinon.stub(job.remoteAccessApi, 'getJobProgressiveText').value(function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      if (start === 0) {
        cb(null, null, { statusCode: 200, text: 'Console output', headers: { 'x-more-data': 'true', 'x-text-size': 20 } });
      } else if (start === 20) {
        assert.equals(start, 20);
        cb(null, null, { statusCode: 200, text: 'Console output', headers: { 'x-more-data': 'true', 'x-text-size': 40 } });
      } else {
        assert.equals(start, 40);
        cb(null, null, { statusCode: 200, headers: { 'x-more-data': 'false', 'x-text-size': 40 } });
      }
    });
    job.streamConsole('somejob', 123, 0, done);
  });
  it('streamConsole - should display console output once when the second text is undefined', function (done) {
    sinon.stub(ConsoleStream.prototype, 'emit').value(function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.isUndefined(value);
      }
    });
    sinon.stub(job.remoteAccessApi, 'getJobProgressiveText').value(function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      if (start === 0) {
        cb(null, null, { statusCode: 200, text: 'Console output 1', headers: { 'x-more-data': 'true', 'x-text-size': 20 } });
      } else if (start === 20) {
        assert.equals(start, 20);
        cb(null, null, { statusCode: 200, headers: { 'x-more-data': 'true', 'x-text-size': 40 } });
      } else {
        assert.equals(start, 40);
        cb(null, null, { statusCode: 200, headers: { 'x-more-data': 'false', 'x-text-size': 40 } });
      }
    });
    job.streamConsole('somejob', 123, 0, done);
  });
  it('enable - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'postJobEnable').value(function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.enable('somejob', done);
  });
  it('disable - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'postJobDisable').value(function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.disable('somejob', done);
  });
  it('copy - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'postCreateItem').value(function (name, opts, cb) {
      assert.equals(name, 'newjob');
      assert.equals(opts.from, 'existingjob');
      assert.equals(opts.mode, 'copy');
      assert.equals(opts.contentType, 'text/plain');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.copy('existingjob', 'newjob', done);
  });
  it('fetchConfig - should send request to API endpoint', function (done) {
    sinon.stub(job.remoteAccessApi, 'getJobConfig').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });
    job.fetchConfig('somejob', done);
  });
  it('parseFeed - should parse feed from API endpoint', function (done) {
    sinon.stub(RssParser.prototype, 'parseURL').value(function (url, cb) {
      assert.equals(url, 'http://localhost:8080/job/somejob/rssAll');
      cb();
    });
    job.parseFeed('somejob', done);
  });
});
