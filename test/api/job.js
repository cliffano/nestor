var buster        = require('buster-node');
var ConsoleStream = require('../../lib/api/consolestream');
var feedRead      = require('feed-read');
var job           = require('../../lib/api/job');
var proxyquire    = require('proxyquire');
var referee       = require('referee');
var Swaggy        = require('swaggy_jenkins');
var text          = require('bagoftext');
var assert        = referee.assert;

buster.testCase('api - job', {
  setUp: function () {
    this.mockFeedRead = this.mock(feedRead);

    job.url  = 'http://localhost:8080';
    job.opts = { handlers: {}, headers: { jenkinsCrumb: 'somecrumb' } };
    job.remoteAccessApi = new Swaggy.RemoteAccessApi();
  },
  tearDown: function () {
    delete job.opts;
  },
  'create - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'postCreateItem', function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.equals(opts.contentType, 'application/xml');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.create('somejob', '<xml>some config</xml>', done);
  },
  'read - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'getJob', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });
    job.read('somejob', done);
  },
  'readLatest - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'getJobLastBuild', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });
    job.readLatest('somejob', done);
  },
  'update - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'postJobConfig', function (name, body, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(body, '<xml>some config</xml>');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.update('somejob', '<xml>some config</xml>', done);
  },
  'delete - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'postJobDelete', function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.delete('somejob', done);
  },
  'stop - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'postJobLastBuildStop', function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.stop('somejob', done);
  },
  'build - should send request to API endpoint without parameters when not supplied': function (done) {
    this.stub(job.remoteAccessApi, 'postJobBuild', function (name, body, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(body, '{"parameter":[]}');
      assert.equals(opts.token, 'nestor');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.build('somejob', {}, done);
  },
  'build - should send request to API endpoint with parameters when supplied': function (done) {
    this.stub(job.remoteAccessApi, 'postJobBuild', function (name, body, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(body, '{"parameter":[{"name":"someparam1","value":"somevalue1"},{"name":"someparam2","value":"somevalue2"}]}');
      assert.equals(opts.token, 'nestor');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.build('somejob', { someparam1: 'somevalue1', someparam2: 'somevalue2' }, done);
  },
  'checkStarted - returns true when build has an executable url': function (done) {
    var expectStarted = function(ready) {
      assert.equals(ready, true);
      done();
    };
    this.stub(job.remoteAccessApi, 'getQueueItem', function (number, cb) {
      assert.equals(number, '15032');
      cb(null, { _class: 'hudson.model.Queue$LeftItem' });
    });
    job.checkStarted('https://localhost:8080/queue/item/15032/', expectStarted);
  },
  'checkStarted - returns false when build does not yet have an executable url': function (done) {
    var expectNotStarted = function(ready) {
      assert.equals(ready, false);
      done();
    };
    this.stub(job.remoteAccessApi, 'getQueueItem', function (number, cb) {
      assert.equals(number, '15032');
      cb(null, { _class: 'hudson.model.Queue$WaitingItem' });
    });
    job.checkStarted('https://localhost:8080/queue/item/15032/', expectNotStarted);
  },
  'streamConsole - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'getJobProgressiveText', function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      assert.equals(start, 0);
      cb(null, null, { statusCode: 500 });
    });
    job.streamConsole('somejob', 123, 88000, done);
  },
  'streamConsole - should display console output once when there is no more text': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(job.remoteAccessApi, 'getJobProgressiveText', function (name, number, start, cb) {
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
  },
  'streamConsole - should display no console output once when result does not have any body': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      assert.equals(value, undefined);
    });
    this.stub(job.remoteAccessApi, 'getJobProgressiveText', function (name, number, start, cb) {
      assert.equals(name, 'somejob');
      assert.equals(number, 123);
      cb(null, null, { statusCode: 200, headers: { 'x-more-data': 'false', 'x-text-size': 20 } });
    });
    job.streamConsole('somejob', 123, 0, done);
  },
  'streamConsole - should display console output once when there is more text but an error occurs': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(job.remoteAccessApi, 'getJobProgressiveText', function (name, number, start, cb) {
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
  },
  'streamConsole - should display console output multiple times when there are more texts': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(job.remoteAccessApi, 'getJobProgressiveText', function (name, number, start, cb) {
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
  },
  'streamConsole - should display console output once when the second text is undefined': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(job.remoteAccessApi, 'getJobProgressiveText', function (name, number, start, cb) {
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
  },
  'enable - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'postJobEnable', function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.enable('somejob', done);
  },
  'disable - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'postJobDisable', function (name, opts, cb) {
      assert.equals(name, 'somejob');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.disable('somejob', done);
  },
  'copy - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'postJobDisable', function (name, opts, cb) {
      assert.equals(name, 'newjob');
      assert.equals(opts.from, 'existingjob');
      assert.equals(opts.mode, 'copy');
      assert.equals(opts.contentType, 'text/plain');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    job.copy('existingjob', 'newjob', done);
  },
  'fetchConfig - should send request to API endpoint': function (done) {
    this.stub(job.remoteAccessApi, 'getJobConfig', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });
    job.fetchConfig('somejob', done);
  },
  'parseFeed - should parse feed from API endpoint': function (done) {
    var mockFeedRead = function (url, cb) {
      assert.equals(url, 'http://localhost:8080/job/somejob/rssAll');
      cb();
    };
    var job = proxyquire('../../lib/api/job.js', { 'feed-read': mockFeedRead });
    job.url  = 'http://localhost:8080';
    job.parseFeed('somejob', done);
  }
});
