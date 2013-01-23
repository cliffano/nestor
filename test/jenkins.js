var bag = require('bagofholding'),
  buster = require('buster'),
  dgram = require('dgram'),
  Jenkins = require('../lib/jenkins'),
  request = require('request');

buster.testCase('jenkins - jenkins', {
  'should use url and optional proxy when specified': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(url, 'http://jenkins-ci.org:8080/job/job1/build');
      assert.equals(opts.proxy, 'http://someproxy');
      opts.handlers['401']({ statusCode: 401 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://jenkins-ci.org:8080', { proxy: 'http://someproxy' });
    jenkins.build('job1', undefined, function (err, result) {
      done();
    });
  },
  'should use default url and no optional proxy when not specified': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(url, 'http://localhost:8080/job/job1/build');
      assert.equals(opts.proxy, undefined);
      opts.handlers['401']({ statusCode: 401 }, cb);
    };
    this.stub(process, 'env', {}); // simulate no http_proxy environment variable
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins();
    jenkins.build('job1', undefined, function (err, result) {
      done();
    });
  },
  'should use http_proxy when optional proxy is not specified and env variable http_proxy is set': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(url, 'http://localhost:8080/job/job1/build');
      assert.equals(opts.proxy, 'http://someproxy');
      opts.handlers['401']({ statusCode: 401 }, cb);
    };
    this.stub(process, 'env', { http_proxy: 'http://someproxy' });
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins();
    jenkins.build('job1', undefined, function (err, result) {
      done();
    });
  },
  'should pass authentication failed error to callback when result has status code 401': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      opts.handlers['401']({ statusCode: 401 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.build('job1', undefined, function (err, result) {
      assert.equals(err.message, 'Authentication failed - incorrect username and/or password in JENKINS_URL');
      done();
    });
  },
  'should pass authentication required error to callback when result has status code 403': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      opts.handlers['403']({ statusCode: 401 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.build('job1', undefined, function (err, result) {
      assert.equals(err.message, 'Jenkins requires authentication - set username and password in JENKINS_URL');
      done();
    });
  }
});

buster.testCase('jenkins - build', {
  'should pass error not found when job does not exist': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/build');
      assert.equals(opts.queryStrings.token, 'nestor');
      assert.equals(opts.queryStrings.json, '{"parameter":[]}');
      opts.handlers['404']({ statusCode: 404 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.build('job1', undefined, function (err, result) {
      assert.equals(err.message, 'Job job1 does not exist');
      assert.equals(result, undefined);
      done();
    });
  },
  'should pass error not allowed job requires build parameters': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/build');
      assert.equals(opts.queryStrings.token, 'nestor');
      assert.equals(opts.queryStrings.json, '{"parameter":[]}');
      opts.handlers['405']({ statusCode: 405 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.build('job1', undefined, function (err, result) {
      assert.equals(err.message, 'Job job1 requires build parameters');
      assert.equals(result, undefined);
      done();
    });
  },
  'should use get method when job is not parameterised': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/build');
      assert.equals(opts.queryStrings.token, 'nestor');
      assert.equals(opts.queryStrings.json, '{"parameter":[]}');
      opts.handlers['200']({ statusCode: 200 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.build('job1', undefined, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result, undefined);
      done();
    });
  },
  'should use post method when job is parameterised': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'post');
      assert.equals(url, 'http://localhost:8080/job/job1/build');
      assert.equals(opts.queryStrings.token, 'nestor');
      assert.equals(opts.queryStrings.json, '{"parameter":[{"name":"foo","value":"bar"},{"name":"abc","value":"xyz"}]}');
      opts.handlers['200']({ statusCode: 200 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.build('job1', 'foo=bar&abc=xyz', function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result, undefined);
      done();
    });
  }
});

buster.testCase('jenkins - console', {
  setUp: function () {
    this.mockConsole = this.mock(console);
  },
  'should pass error not found when job does not exist': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/logText/progressiveText');
      opts.handlers['404']({ statusCode: 404 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.console('job1', function (err, result) {
      assert.equals(err.message, 'Job job1 does not exist');
      assert.equals(result, undefined);
      done();
    });
  },
  'should display a single console output when there is no more text': function (done) {
    this.mockConsole.expects('log')
      .once().withExactArgs('Job started by Foo');
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/logText/progressiveText');
      opts.handlers['200']({ statusCode: 200, body: 'Job started by Foo', headers: { 'x-more-data': 'false' } }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.console('job1', function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result, undefined);
      done();
    });
  },
  'should not display anything if there is only a single console output with no value (e.g. build step sleeping for several seconds)': function (done) {
    this.mockConsole.expects('log').never();
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/logText/progressiveText');
      opts.handlers['200']({ statusCode: 200, body: undefined, headers: { 'x-more-data': 'false' } }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.console('job1', function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result, undefined);
      done();
    });
  },
  'should display console output until there is no more text': function (done) {
    this.mockConsole.expects('log')
      .once().withExactArgs('Console output 1');
    this.mockConsole.expects('log')
      .once().withExactArgs('Console output 2');
    // only first request uses bag.http.request
    var mockBagRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/logText/progressiveText');
      opts.handlers['200']({
        statusCode: 200,
        body: 'Console output 1',
        headers: { 'x-more-data': 'true', 'x-text-size': 10 } 
      }, cb);
    };
    // the subsequent request uses request module
    var mockRequest = this.mock(request);
    mockRequest.expects('get').once().callsArgWith(1, null, {
      statusCode: 200,
      body: 'Console output 2',
      headers: { 'x-more-data': 'false', 'x-text-size': 20 }
    });
    this.stub(bag, 'http', { request: mockBagRequest });
    var jenkins = new Jenkins('http://localhost:8080', { proxy: 'http://someproxy' });
    jenkins.console('job1', { interval: 1 }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result, undefined);
      done();
    });
  },
  'should not display chunked console output when result body is undefined': function (done) {
    this.mockConsole.expects('log')
      .once().withExactArgs('Console output 1');
    // only first request uses bag.http.request
    var mockBagRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/logText/progressiveText');
      opts.handlers['200']({
        statusCode: 200,
        body: 'Console output 1',
        headers: { 'x-more-data': 'true', 'x-text-size': 10 } 
      }, cb);
    };
    // the subsequent request uses request module
    var mockRequest = this.mock(request);
    mockRequest.expects('get').once().callsArgWith(1, null, {
      statusCode: 200,
      headers: { 'x-more-data': 'false', 'x-text-size': 20 }
    });
    this.stub(process, 'env', {}); // simulate no http_proxy environment variable
    this.stub(bag, 'http', { request: mockBagRequest });
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.console('job1', { interval: 1 }, function (err, result) {
      assert.equals(err, undefined);
      assert.equals(result, undefined);
      done();
    });
  },
  'should pass error when chunking console output has an error': function (done) {
    this.mockConsole.expects('log')
      .once().withExactArgs('Console output 1');
    // only first request uses bag.http.request
    var mockBagRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/logText/progressiveText');
      opts.handlers['200']({
        statusCode: 200,
        body: 'Console output 1',
        headers: { 'x-more-data': 'true', 'x-text-size': 10 } 
      }, cb);
    };
    // the subsequent request uses request module
    var mockRequest = this.mock(request);
    mockRequest.expects('get').once().callsArgWith(1, new Error('someerror'));
    this.stub(bag, 'http', { request: mockBagRequest });
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.console('job1', { interval: 1 }, function (err, result) {
      assert.equals(err.message, 'someerror');
      assert.equals(result, undefined);
      done();
    });
  }
});

buster.testCase('jenkins - stop', {
  'should pass error not found when job does not exist': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/stop');
      opts.handlers['404']({ statusCode: 404 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.stop('job1', function (err, result) {
      assert.equals(err.message, 'Job job1 does not exist');
      assert.equals(result, undefined);
      done();
    });
  },
  'should give status code 200 when there is no error': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/lastBuild/stop');
      opts.handlers['200']({ statusCode: 200 }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.stop('job1', function (err, result) {
      assert.isNull(err);
      assert.equals(result, undefined);
      done();
    });
  }
});

buster.testCase('jenkins - dashboard', {
  'should return empty data when dashboard has no job': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/api/json');
      opts.handlers['200']({ statusCode: 200, body: '{ "jobs": [] }' }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard(function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 0);
      done();
    });
  },
  'should return statuses when dashboard has jobs with known color value': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/api/json');
      opts.handlers['200']({ statusCode: 200, body: JSON.stringify(
        { jobs: [
          { name: 'job1', color: 'blue' },
          { name: 'job2', color: 'green' },
          { name: 'job3', color: 'grey' },
          { name: 'job4', color: 'red' },
          { name: 'job5', color: 'yellow' }
        ]}
      )}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard(function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 5);
      assert.equals(result[0].name, 'job1');
      assert.equals(result[0].status, 'OK');
      assert.equals(result[1].name, 'job2');
      assert.equals(result[1].status, 'OK');
      assert.equals(result[2].name, 'job3');
      assert.equals(result[2].status, 'ABORTED');
      assert.equals(result[3].name, 'job4');
      assert.equals(result[3].status, 'FAIL');
      assert.equals(result[4].name, 'job5');
      assert.equals(result[4].status, 'WARN');
      done();
    });
  },
  'should return statuses when dashboard has running jobs with animated color value': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/api/json');
      opts.handlers['200']({ statusCode: 200, body: JSON.stringify(
        { jobs: [
          { name: 'job1', color: 'grey_anime' },
          { name: 'job2', color: 'red_anime' }
        ]}
      )}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard(function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 2);
      assert.equals(result[0].name, 'job1');
      assert.equals(result[0].status, 'ABORTED');
      assert.equals(result[1].name, 'job2');
      assert.equals(result[1].status, 'FAIL');
      done();
    });
  },
  'should return statuses when dashboard has jobs with unknown color value': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/api/json');
      opts.handlers['200']({ statusCode: 200, body: JSON.stringify(
        { jobs: [
          { name: 'job1', color: 'disabled' }
        ]}
      )}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.dashboard(function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 1);
      assert.equals(result[0].name, 'job1');
      assert.equals(result[0].status, 'DISABLED');
      done();
    });
  }
});

buster.testCase('jenkins - discover', {
  'should close socket and pass error to callback when socket emits error event': function (done) {
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
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'someerror');
      assert.equals(result, undefined);
      done();
    });
    assert.equals(closeCallCount, 1);
  },
  'should close socket and pass error to callback when an error occurs while sending a message': function (done) {
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
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err.message, 'someerror');
      assert.equals(result, undefined);
      done();
    });
    assert.equals(closeCallCount, 1);
  },
  'should close socket and pass result to callback when socket emits message event': function (done) {
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
    var jenkins = new Jenkins('http://localhost:8080');
    jenkins.discover('somehost', function cb(err, result) {
      assert.equals(err, null);
      assert.equals(result.hudson['server-id'][0], '362f249fc053c1ede86a218587d100ce');
      assert.equals(result.hudson['slave-port'][0], '55328');
      assert.equals(result.hudson.url[0], 'http://localhost:8080/');
      assert.equals(result.hudson.version[0], '1.431');
      done();
    });
    assert.equals(closeCallCount, 1);
  }
});

buster.testCase('jenkins - executor', {
  'should pass executor idle, stuck, and progress status when executor has them': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/computer/api/json');
      assert.equals(opts.queryStrings.depth, 1);
      opts.handlers['200']({ statusCode: 200, body: JSON.stringify({
        computer: [
          {
            displayName: 'master',
            executors: [
              { idle: false, likelyStuck: false, progress: 88, currentExecutable: { url: 'http://localhost:8080/job/job1/19/' } },
              { idle: true, likelyStuck: false, progress: 0 }
            ]
          },
          {
            displayName: 'slave',
            executors: [
              { idle: false, likelyStuck: true, progress: 88, currentExecutable: { url: 'http://localhost:8080/job/job2/30/' } }
            ]
          }
        ]
      })}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.executor(function (err, result) {
      assert.isNull(err);

      // multiple executors on a master
      assert.equals(result.master.length, 2);
      assert.equals(result.master[0].progress, 88);
      assert.equals(result.master[0].stuck, false);
      assert.equals(result.master[0].idle, false);
      assert.equals(result.master[0].name, 'job1');
      assert.equals(result.master[1].progress, 0);
      assert.equals(result.master[1].stuck, false);
      assert.equals(result.master[1].idle, true);
      assert.equals(result.master[1].name, undefined);

      // single executor on a slave
      assert.equals(result.slave.length, 1);
      assert.equals(result.slave[0].progress, 88);
      assert.equals(result.slave[0].stuck, true);
      assert.equals(result.slave[0].idle, false);
      assert.equals(result.slave[0].name, 'job2');

      done();
    });
  }
});

buster.testCase('jenkins - job', {
  'should pass job status and results when job exists': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/api/json');
      opts.handlers['200']({ statusCode: 200, body: JSON.stringify({
        color: 'blue',
        healthReport: [
          { description: 'Coverage is 100%' },
          { description: 'All system is go!' }
        ]
      })}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.job('job1', function (err, result) {
      assert.isNull(err);
      assert.equals(result.status, 'OK');
      assert.equals(result.reports[0], 'Coverage is 100%');
      assert.equals(result.reports[1], 'All system is go!');
      done();
    });
  },
  'should pass error when job does not exist': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/job/job1/api/json');
      opts.handlers['404']({ statusCode: 404, body: 'somenotfounderror' }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.job('job1', function (err, result) {
      assert.equals(err.message, 'Job job1 does not exist');
      assert.equals(result, undefined);
      done();
    });
  }
});

buster.testCase('jenkins - queue', {
  'should pass job names when queue is not empty': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/queue/api/json');
      opts.handlers['200']({ statusCode: 200, body: JSON.stringify({
        items: [
          { task: { name: 'job1' }},
          { task: { name: 'job2' }}
        ]
      })}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.queue(function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 2);
      assert.equals(result[0], 'job1');
      assert.equals(result[1], 'job2');
      done();
    });
  },
  'should pass empty job names when queue is empty': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'get');
      assert.equals(url, 'http://localhost:8080/queue/api/json');
      opts.handlers['200']({ statusCode: 200, body: JSON.stringify({
        items: []
      })}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.queue(function (err, result) {
      assert.isNull(err);
      assert.equals(result.length, 0);
      done();
    });
  }
});

buster.testCase('jenkins - version', {
  'should pass error to callback when headers do not contain x-jenkins': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'head');
      assert.equals(url, 'http://localhost:8080');
      opts.handlers['200']({ headers: {} }, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.version(function (err, result) {
      assert.equals(err.message, 'Not a Jenkins server');
      assert.equals(result, undefined);
      done();
    });
  },
  'should pass version to callback when headers contain x-jenkins': function (done) {
    var mockRequest = function (method, url, opts, cb) {
      assert.equals(method, 'head');
      assert.equals(url, 'http://localhost:8080');
      opts.handlers['200']({ statusCode: 200, headers: { 'x-jenkins': '1.464' }}, cb);
    };
    this.stub(bag, 'http', { request: mockRequest });
    var jenkins = new Jenkins('http://localhost:8080');    
    jenkins.version(function (err, result) {
      assert.isNull(err);
      assert.equals(result, '1.464');
      done();
    });
  }
});

buster.testCase('jenkins - _status', {
  'should show the correct status for all supported colors': function () {
    var jenkins = new Jenkins();
    assert.equals(jenkins._status('blue'), 'OK');
    assert.equals(jenkins._status('green'), 'OK');
    assert.equals(jenkins._status('grey'), 'ABORTED');
    assert.equals(jenkins._status('red'), 'FAIL');
    assert.equals(jenkins._status('yellow'), 'WARN');
  },
  'should show the correct status for actively running build': function () {
    var jenkins = new Jenkins();
    assert.equals(jenkins._status('blue_anime'), 'OK');
  },
  'should uppercase status when it is unsupported': function () {
    var jenkins = new Jenkins();
    assert.equals(jenkins._status('unknown'), 'UNKNOWN');
  }
});
