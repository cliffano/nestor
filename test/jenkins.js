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

buster.testCase('jenkins - filteredBuild', {
  setUp: function () {
    this.mockConsole = this.mock(console);
  },
  'should pass error when dashboard cannot retrieve jobs list': function (done) {
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard = function (cb) {
      cb(new Error('some error'));
    };
    jenkins.filteredBuild(null, function (err, result) {
      assert.equals(err.message, 'some error');
      done();
    });
  },
  'should trigger all builds when criteria is not specified': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was started successfully', 'foo');
    this.mockConsole.expects('log').once().withExactArgs('Job %s was started successfully', 'bar');
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard = function (cb) {
      var data = [
        { name: 'foo', status: 'FAIL' },
        { name: 'bar', status: 'OK' }
      ];
      cb(null, data);
    };
    jenkins.build = function (name, params, cb) {
      cb();
    };
    jenkins.filteredBuild(null, function (err, result) {
      assert.equals(err, undefined);
      done();
    });
  },
  'should trigger only builds which fits criteria': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was started successfully', 'foo');
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard = function (cb) {
      var data = [
        { name: 'foo', status: 'FAIL' },
        { name: 'bar', status: 'OK' }
      ];
      cb(null, data);
    };
    jenkins.build = function (name, params, cb) {
      cb();
    };
    jenkins.filteredBuild({ status: 'FAIL' }, function (err, result) {
      assert.equals(err, undefined);
      done();
    });
  },
  'should pass error when an error occurs while executing the build': function (done) {
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard = function (cb) {
      var data = [
        { name: 'foo', status: 'FAIL' },
        { name: 'bar', status: 'OK' }
      ];
      cb(null, data);
    };
    jenkins.build = function (name, params, cb) {
      cb(new Error('some error'));
    };
    jenkins.filteredBuild({ status: 'FAIL' }, function (err, result) {
      assert.equals(err.message, 'some error');
      done();
    });
  }
});

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

buster.testCase('jenkins - feed', {
  setUp: function () {
    this.mockFeedParser = this.mock(feedparser);
  },
  'should parse jenkins feed articles when job name is not provided': function (done) {
    this.mockFeedParser.expects('parseUrl').once().withArgs('http://localhost:8080/rssAll').callsArgWith(1, null, null, [ { title: 'some title 1' }, { title: 'some title 2' }]);
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.feed(undefined, function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 2);
      assert.equals(result[0].title, 'some title 1');
      assert.equals(result[1].title, 'some title 2');
      done();
    });
  },
  'should parse job feed articles when job name is provided': function (done) {
    this.mockFeedParser.expects('parseUrl').once().withArgs('http://localhost:8080/job/somejob/rssAll').callsArgWith(1, null, null, [ { title: 'some title 1' }, { title: 'some title 2' }]);
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.feed({ jobName: 'somejob' }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 2);
      assert.equals(result[0].title, 'some title 1');
      assert.equals(result[1].title, 'some title 2');
      done();
    });
  },
  'should parse view feed articles when view name is provided': function (done) {
    this.mockFeedParser.expects('parseUrl').once().withArgs('http://localhost:8080/view/someview/rssAll').callsArgWith(1, null, null, [ { title: 'some title 1' }, { title: 'some title 2' }]);
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.feed({ viewName: 'someview' }, function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 2);
      assert.equals(result[0].title, 'some title 1');
      assert.equals(result[1].title, 'some title 2');
      done();
    });
  },
  'should error to callback when an error occurs': function (done) {
    this.mockFeedParser.expects('parseUrl').once().withArgs('http://localhost:8080/job/somejob/rssAll').callsArgWith(1, new Error('some error'));
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.feed({ jobName: 'somejob' }, function (err, result) {
      assert.equals(err.message, 'some error');
      assert.equals(result, undefined);
      done();
    });
  }
});

buster.testCase('jenkins - monitor', {
  'should call notify callback with last article title when result exists': function (done) {
    this.stub(cron.CronJob.prototype, 'start', function () {
      done();
    });
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.dashboard = function (opts, cb) {
      var data = [
        { status: 'OK', name: 'job1' },
        { status: 'ABORTED', name: 'job2' },
        { status: 'OK', name: 'job3' }
      ];
      cb(null, data);
    };
    jenkins.monitor({ jobName: 'job2', schedule: '*/30 * * * * *' }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, 'ABORTED');
    });
  },
  'should call notify callback when there is no job but there is no monitoring error as well': function (done) {
    this.stub(cron.CronJob.prototype, 'start', function () {
      done();
    });
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.dashboard = function (opts, cb) {
      cb(null, []);
    };
    jenkins.monitor({ jobName: 'somejob', schedule: '*/30 * * * * *' }, function (err, result) {
      assert.isNull(err);
      assert.isNull(result);
    });
  },
  'should call notify callback with undefined result and error when an error occurs while getting dashboard data': function (done) {
    this.stub(cron.CronJob.prototype, 'start', function () {
      done();
    });
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.dashboard = function (opts, cb) {
      cb(new Error('some error'));
    };
    jenkins.monitor({ jobName: 'somejob' }, function (err, result) {
      assert.equals(err.message, 'some error');
      assert.equals(result, undefined);
    });
  }
});

buster.testCase('jenkins - _statusByColor', {
  'should show the correct status for all supported colors': function () {
    var jenkins = new Jenkins();
    assert.equals(jenkins._statusByColor('blue'), 'OK');
    assert.equals(jenkins._statusByColor('green'), 'OK');
    assert.equals(jenkins._statusByColor('grey'), 'ABORTED');
    assert.equals(jenkins._statusByColor('red'), 'FAIL');
    assert.equals(jenkins._statusByColor('yellow'), 'WARN');
  },
  'should show the correct status for actively running build': function () {
    var jenkins = new Jenkins();
    assert.equals(jenkins._statusByColor('blue_anime'), 'OK');
  },
  'should uppercase status when it is unsupported': function () {
    var jenkins = new Jenkins();
    assert.equals(jenkins._statusByColor('unknown'), 'UNKNOWN');
  }
});

buster.testCase('jenkins - _statusByName', {
  setUp: function () {
    this.jenkins = new Jenkins();
  },
  'should return ok status all jobs are successful': function () {
    var data = [
      { status: 'OK', name: 'job1' },
      { status: 'OK', name: 'job2' },
      { status: 'OK', name: 'job3' }
    ];
    assert.equals(this.jenkins._statusByName({}, data), 'OK');
  },
  'should return fail status when there is a failed job': function () {
    var data = [
      { status: 'OK', name: 'job1' },
      { status: 'OK', name: 'job2' },
      { status: 'FAIL', name: 'job3' }
    ];
    assert.equals(this.jenkins._statusByName({}, data), 'FAIL');
  },
  'should return warn status when there is a warn but there is no fail': function () {
    var data = [
      { status: 'ABORTED', name: 'job1' },
      { status: 'OK', name: 'job2' },
      { status: 'WARN', name: 'job3' }
    ];
    assert.equals(this.jenkins._statusByName({}, data), 'WARN');
  },
  'should return aborted status when there is aborted job but no fail or warn': function () {
    var data = [
      { status: 'ABORTED', name: 'job1' },
      { status: 'OK', name: 'job2' },
      { status: 'OK', name: 'job3' }
    ];
    assert.equals(this.jenkins._statusByName({}, data), 'ABORTED');
  },
  'should return null status when are neither ok, fail, or warn': function () {
    var data = [
      { status: 'foobar', name: 'job1' },
      { status: 'foobar', name: 'job2' },
      { status: 'foobar', name: 'job3' }
    ];
    assert.isNull(this.jenkins._statusByName({}, data));
  }
});
