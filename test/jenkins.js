var buster = require('buster-node'),
  cron = require('cron'),
  dgram = require('dgram'),
  feedparser = require('feedparser'),
  Jenkins = require('../lib/jenkins'),
  referee = require('referee'),
  req = require('bagofrequest'),
  request = require('request'),
  text = require('bagoftext'),
  assert = referee.assert,
  refute = referee.refute;


text.setLocale('en');

// buster.testCase('jenkins - jenkins', {
//   setUp: function () {
//     this.stub(process, 'env', {});
//   },
//   'should use url when specified': function (done) {
//     var mockRequest = function (method, url, opts, cb) {
//       assert.equals(url, 'http://jenkins-ci.org:8080/job/job1/build');
//       opts.handlers[401]({ statusCode: 401 }, cb);
//     };
//     this.stub(req, 'request', mockRequest);
//     var jenkins = new Jenkins('http://jenkins-ci.org:8080');
//     jenkins.build('job1', undefined, function (err, result) {
//       done();
//     });
//   },
//   'should use default url when no url specified': function (done) {
//     var mockRequest = function (method, url, opts, cb) {
//       assert.equals(url, 'http://localhost:8080/job/job1/build');
//       opts.handlers[401]({ statusCode: 401 }, cb);
//     };
//     this.stub(req, 'request', mockRequest);
//     var jenkins = new Jenkins();
//     jenkins.build('job1', undefined, function (err, result) {
//       done();
//     });
//   },
//   'should use proxy when proxy is set': function (done) {
//     var mockRequest = function (method, url, opts, cb) {
//       assert.equals(url, 'http://localhost:8080/job/job1/build');
//       opts.handlers[401]({ statusCode: 401 }, cb);
//     };
//     this.stub(req, 'request', mockRequest);
//     var jenkins = new Jenkins();
//     jenkins.build('job1', undefined, function (err, result) {
//       done();
//     });
//   },
//   'should pass authentication failed error to callback when result has status code 401': function (done) {
//     var mockRequest = function (method, url, opts, cb) {
//       opts.handlers[401]({ statusCode: 401 }, cb);
//     };
//     this.stub(req, 'request', mockRequest);
//     var jenkins = new Jenkins('http://localhost:8080');    
//     jenkins.build('job1', undefined, function (err, result) {
//       assert.equals(err.message, 'Authentication failed - incorrect username and/or password in Jenkins URL');
//       done();
//     });
//   },
//   'should pass authentication required error to callback when result has status code 403': function (done) {
//     var mockRequest = function (method, url, opts, cb) {
//       opts.handlers[403]({ statusCode: 403 }, cb);
//     };
//     this.stub(req, 'request', mockRequest);
//     var jenkins = new Jenkins('http://localhost:8080');    
//     jenkins.build('job1', undefined, function (err, result) {
//       assert.equals(err.message, 'Jenkins requires authentication - set username and password in Jenkins URL');
//       done();
//     });
//   }
// });

buster.testCase('jenkins - last', {
    'should pass build data and date when build exists': function (done) {
        var mockRequest = function (method, url, opts, cb) {
            assert.equals(method, 'get');
            assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/api/json');
            opts.handlers[200]({ statusCode: 200, body: JSON.stringify({
                result: 'SUCCESS',
                duration: 1000,
                building: false,
                timestamp: 1395318976080
            })}, cb);
        };
        this.stub(req, 'request', mockRequest);
        var jenkins = new Jenkins('http://localhost:8080');
        jenkins.last('job1', function (err, result) {
            assert.isNull(err);
            assert.equals(result.result, 'SUCCESS');
            assert.equals(result.building, false);
            assert.equals(result.buildDate, '2014-03-20T12:36:17.080Z');
            assert.match(result.buildDateDistance, /^Ended .+$/);
            done();
        });
    },
    'should give the time from when the build started if it is currently running': function (done) {
        var mockRequest = function (method, url, opts, cb) {
            assert.equals(method, 'get');
            assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/api/json');
            opts.handlers[200]({ statusCode: 200, body: JSON.stringify({
                building: true,
                duration: 1000,
                timestamp: 1395318976080
            })}, cb);
        };
        this.stub(req, 'request', mockRequest);
        var jenkins = new Jenkins('http://localhost:8080');
        jenkins.last('job1', function (err, result) {
            assert.isNull(err);
            refute.defined(result.result);
            assert.equals(result.building, true);
            assert.equals(result.buildDate, '2014-03-20T12:36:16.080Z');
            assert.match(result.buildDateDistance, /^Started .+$/);
            done();
        });
    },
    'should pass error when build does not exist': function (done) {
        var mockRequest = function (method, url, opts, cb) {
            assert.equals(method, 'get');
            assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/api/json');
            opts.handlers[404]({ statusCode: 404, body: 'somenotfounderror' }, cb);
        };
        this.stub(req, 'request', mockRequest);
        var jenkins = new Jenkins('http://localhost:8080');
        jenkins.last('job1', function (err, result) {
            assert.equals(err.message, 'No build could be found for job job1');
            assert.equals(result, undefined);
            done();
        });
    }
});

buster.testCase('jenkins - monitor', {
  'should monitor the latest job on Jenkins instance when no job or view opt specified': function (done) {
    this.stub(cron.CronJob.prototype, 'start', function () {
      done();
    });
    var jenkins = new Jenkins('http://localhost:8080');
    this.stub(Jenkins.prototype, 'info', function (cb) {
      var result = { jobs: [
        { color: 'blue' },
        { color: 'red' }
      ]};
      cb(null, result);
    });
    jenkins.monitor({ schedule: '*/30 * * * * *' }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, 'ok');
    });
  },
  'should monitor the latest job on a view when view opt is specified': function (done) {
    this.stub(cron.CronJob.prototype, 'start', function () {
      done();
    });
    var jenkins = new Jenkins('http://localhost:8080');
    this.stub(Jenkins.prototype, 'readView', function (name, cb) {
      assert.equals(name, 'someview');
      var result = { jobs: [
        { color: 'blue' },
        { color: 'red' }
      ]};
      cb(null, result);
    });
    jenkins.monitor({ view: 'someview', schedule: '*/30 * * * * *' }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, 'ok');
    });
  },
  'should monitor the latest job when job opt is specified': function (done) {
    this.stub(cron.CronJob.prototype, 'start', function () {
      done();
    });
    var jenkins = new Jenkins('http://localhost:8080');
    this.stub(Jenkins.prototype, 'readJob', function (name, cb) {
      assert.equals(name, 'somejob');
      var result = { color: 'blue' };
      cb(null, result);
    });
    jenkins.monitor({ job: 'somejob', schedule: '*/30 * * * * *' }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, 'ok');
    });
  }
});