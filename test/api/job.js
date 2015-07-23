var buster        = require('buster-node');
var ConsoleStream = require('../../lib/api/consolestream');
var feedparser    = require('feedparser');
var job           = require('../../lib/api/job');
var referee       = require('referee');
var req           = require('bagofrequest');
var request       = require('request');
var text          = require('bagoftext');
var assert        = referee.assert;

buster.testCase('api - job', {
  setUp: function () {
    this.mockFeedparser = this.mock(feedparser);

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
  'readLatest - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/somejob/lastBuild/api/json');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.readLatest('somejob', done);
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
  'build - should send request to API endpoint without parameters when not supplied': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/somejob/build');
      assert.equals(opts.queryStrings.token, 'nestor');
      assert.equals(opts.queryStrings.json, '{"parameter":[]}');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[201]);
      assert.defined(opts.handlers[404]);
      assert.defined(opts.handlers[405]);
      cb();
    });
    job.build('somejob', {}, done);
  },
  'build - should send request to API endpoint with parameters when supplied': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/somejob/build');
      assert.equals(opts.queryStrings.token, 'nestor');
      assert.equals(opts.queryStrings.json, '{"parameter":[{"name":"someparam1","value":"somevalue1"},{"name":"someparam2","value":"somevalue2"}]}');
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[201]);
      assert.defined(opts.handlers[404]);
      assert.defined(opts.handlers[405]);
      cb();
    });
    job.build('somejob', { someparam1: 'somevalue1', someparam2: 'somevalue2' }, done);
  },
  'streamConsole - should send request to API endpoint': function (done) {
    this.stub(req, 'request', function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/somejob/lastBuild/logText/progressiveText');
      assert.equals(opts.queryStrings.start, 0);
      assert.defined(opts.handlers[200]);
      assert.defined(opts.handlers[404]);
      cb();
    });
    job.streamConsole('somejob', 88000, done);
  },
  'streamConsole - should display console output once when there is no more text': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(req, 'request', function (method, url, opts, cb) {
      var result = {
        statusCode: 200,
        body: 'Console output 1',
        headers: { 'x-more-data': 'false', 'x-text-size': 20 }
      };
      opts.handlers[200](result, done);
    });
    job.streamConsole('somejob', 0, done);
  },
  'streamConsole - should display no console output once when result does not have any body': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      assert.equals(value, undefined);
    });
    this.stub(req, 'request', function (method, url, opts, cb) {
      var result = {
        statusCode: 200,
        headers: { 'x-more-data': 'false', 'x-text-size': 20 }
      };
      opts.handlers[200](result, done);
    });
    job.streamConsole('somejob', 0, done);
  },
  'streamConsole - should display console output once when there is more text but an error occurs': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(req, 'request', function (method, url, opts, cb) {
      if(opts.queryStrings.start === 0){
        var result = {
          statusCode: 200,
          body: 'Console output 1',
          headers: { 'x-more-data': 'true', 'x-text-size': 20 }
        };
        opts.handlers[200](result, done);
      } else {
        cb(new Error('some error'));
      }
    });
    job.streamConsole('somejob', 0, done);
  },
  'streamConsole - should display console output multiple times when there is more text': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(req, 'request', function (method, url, opts, cb) {
      var result = {};
      if(opts.queryStrings.start === 0){
        result = {
          statusCode: 200,
          body: 'Console output',
          headers: { 'x-more-data': 'true', 'x-text-size': 20 }
        };
      } else {
        result = {
          statusCode: 200,
          body: 'Console output',
          headers: { 'x-more-data': 'false', 'x-text-size': 20 }
        };
      }
      opts.handlers[200](result, done);
    });
    job.streamConsole('somejob', 0, done);
  },
  'streamConsole - should display console output once when the second text is undefined': function (done) {
    this.stub(ConsoleStream.prototype, 'emit', function (event, value) {
      if (event === 'data') {
        assert.equals(value, 'Console output 1');
      } else if (event === 'end') {
        assert.equals(value, undefined);
      }
    });
    this.stub(req, 'request', function (method, url, opts, cb) {
      var result = {};
      if(opts.queryStrings.start === 0){
        result = {
          statusCode: 200,
          headers: { 'x-more-data': 'true', 'x-text-size': 20 }
        };
      } else {
        result = {
          statusCode: 200,
          body: 'Console output 1',
          headers: { 'x-more-data': 'false', 'x-text-size': 20 }
        };
      }
      opts.handlers[200](result, done);
    });
    this.stub(req, 'proxy', function (url) {
      return 'http://someproxy:8080';
    });
    job.streamConsole('somejob', 0, done);
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
  },
  'parseFeed - should parse feed from API endpoint': function (done) {
    this.stub(feedparser, 'parseUrl', function (url, cb) {
      assert.equals(url, 'http://localhost:8080/job/somejob/rssAll');
      cb();
    });
    job.parseFeed('somejob', done);
  }
});
