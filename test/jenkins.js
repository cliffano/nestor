var bag = require('bagofholding'),
  _jscov = require('../lib/jenkins'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  jenkins;

describe('jenkins', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/jenkins', {
      requires: mocks ? mocks.requires : {},
      globals: {}
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('jenkins', function () {

    it('should set default URL when none is specified', function () {
      jenkins = new (create(checks, mocks))();
      jenkins.url.should.equal('http://localhost:8080');
    });

    it('should set URL as specified in constructor', function () {
      jenkins = new (create(checks, mocks))('http://ci.jenkins-ci.org');
      jenkins.url.should.equal('http://ci.jenkins-ci.org');
    });

    it('should pass error to callback when an error occurs while sending request', function (done) {
      mocks.request_err = new Error('someerror');
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))();
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.jenkins_dashboard_cb_args[0].message.should.equal('someerror');
      should.not.exist(checks.jenkins_dashboard_cb_args[1]);
    });

    it('should pass authentication failed error to callback when result has status code 401', function (done) {
      mocks.request_result = { statusCode: 401 };
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))();
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.jenkins_dashboard_cb_args[0].message.should.equal('Authentication failed - incorrect username and/or password in JENKINS_URL');
      should.not.exist(checks.jenkins_dashboard_cb_args[1]);
    });

    it('should pass authentication required error to callback when result has status code 403', function (done) {
      mocks.request_result = { statusCode: 403 };
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))();
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.jenkins_dashboard_cb_args[0].message.should.equal('Jenkins requires authentication - set username and password in JENKINS_URL');
      should.not.exist(checks.jenkins_dashboard_cb_args[1]);
    });

    it('should pass error with status code and body to callback when request responds with unexpected status code', function (done) {
      mocks.request_result = { statusCode: 503, body: 'unexpectedbody' };
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      var err = checks.jenkins_dashboard_cb_args[0];
      err.message.should.equal('Unexpected status code 503 from Jenkins\nResponse body:\nunexpectedbody');
      should.not.exist(checks.jenkins_dashboard_cb_args[1]);
    });
  });

  describe('build', function () {

    it('should pass error not found when job does not exist', function (done) {
      mocks.request_result = { statusCode: 404 };
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.build('job1', undefined, function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.jenkins_dashboard_cb_args[0].message.should.equal('Job job1 does not exist');
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/job/job1/build');
      checks.request_opts.qs.token.should.equal('nestor');
      checks.request_opts.qs.json.should.equal('{"parameter":[]}');
    });

    it('should pass error not allowed job requires build parameters', function (done) {
      mocks.request_result = { statusCode: 405 };
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.build('job1', undefined, function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.jenkins_dashboard_cb_args[0].message.should.equal('Job job1 requires build parameters');
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/job/job1/build');
      checks.request_opts.qs.token.should.equal('nestor');
      checks.request_opts.qs.json.should.equal('{"parameter":[]}');
    });

    it('should use get method when job is not parameterised', function (done) {
      mocks.request_result = { statusCode: 200 };
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.build('job1', undefined, function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/job/job1/build');
      checks.request_opts.qs.token.should.equal('nestor');
      checks.request_opts.qs.json.should.equal('{"parameter":[]}');
    });

    it('should use post method when job is parameterised', function (done) {
      mocks.request_result = { statusCode: 200 };
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.build('job1', 'foo=bar&abc=xyz', function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      checks.request_opts.method.should.equal('post');
      checks.request_opts.uri.should.equal('http://localhost:8080/job/job1/build');
      checks.request_opts.qs.token.should.equal('nestor');
      checks.request_opts.qs.json.should.equal('{"parameter":[{"name":"foo","value":"bar"},{"name":"abc","value":"xyz"}]}');
    });
  });

  describe('dashboard', function () {

    it('should return empty data when dashboard has no job', function (done) {
      mocks.request_result = { statusCode: 200, body: '{ "jobs": [] }'};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      checks.jenkins_dashboard_cb_args[1].length.should.equal(0);
    });

    it('should return statuses when dashboard has jobs with known color value', function (done) {
      mocks.request_result = { statusCode: 200, body: JSON.stringify(
        { jobs: [
          { name: 'job1', color: 'blue' },
          { name: 'job2', color: 'green' },
          { name: 'job3', color: 'grey' },
          { name: 'job4', color: 'red' },
          { name: 'job5', color: 'yellow' }
        ]}
      )};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      var jobs = checks.jenkins_dashboard_cb_args[1];
      jobs.length.should.equal(5);
      jobs[0].name.should.equal('job1');
      jobs[0].status.should.equal('OK');
      jobs[1].name.should.equal('job2');
      jobs[1].status.should.equal('OK');
      jobs[2].name.should.equal('job3');
      jobs[2].status.should.equal('ABORTED');
      jobs[3].name.should.equal('job4');
      jobs[3].status.should.equal('FAIL');
      jobs[4].name.should.equal('job5');
      jobs[4].status.should.equal('WARN');
    });

    it('should return statuses when dashboard has running jobs with animated color value', function (done) {
      mocks.request_result = { statusCode: 200, body: JSON.stringify(
        { jobs: [
          { name: 'job1', color: 'grey_anime' },
          { name: 'job2', color: 'red_anime' }
        ]}
      )};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      var jobs = checks.jenkins_dashboard_cb_args[1];
      jobs.length.should.equal(2);
      jobs[0].name.should.equal('job1');
      jobs[0].status.should.equal('ABORTED');
      jobs[1].name.should.equal('job2');
      jobs[1].status.should.equal('FAIL');
    });

    it('should return statuses when dashboard has jobs with unknown color value', function (done) {
      mocks.request_result = { statusCode: 200, body: JSON.stringify(
        { jobs: [
          { name: 'job1', color: 'disabled' }
        ]}
      )};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.dashboard(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      var jobs = checks.jenkins_dashboard_cb_args[1];
      jobs.length.should.equal(1);
      jobs[0].name.should.equal('job1');
      jobs[0].status.should.equal('DISABLED');
    });
  });

  describe('discover', function () {

    beforeEach(function () {
      mocks.requires = {
        dgram: {
          createSocket: function (type) {
            type.should.equal('udp4');
            return bag.mock.socket(checks, mocks);
          }
        }
      };
    });

    afterEach(function () {
      checks.socket_send__args[0].toString().should.equal('Long live Jenkins!');
      checks.socket_send__args[1].should.equal(0);
      checks.socket_send__args[2].should.equal(18);
      checks.socket_send__args[3].should.equal(33848);
      checks.socket_send__args[4].should.equal('somehost');
      (typeof checks.socket_send__args[5]).should.equal('function');
    });

    it('should close socket and pass error to callback when socket emits error event', function (done) {
      mocks.socket_on_error = [new Error('someerror')];
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.discover('somehost', function cb(err, result) {
        checks.jenkins_discover_cb_args = cb['arguments'];
        done();
      });
      checks.socket_close__count.should.equal(1);
      checks.socket_on_error__args[0].should.equal('error');
      (typeof checks.socket_on_error__args[1]).should.equal('function');
      checks.jenkins_discover_cb_args[0].message.should.equal('someerror');
    });

    it('should close socket and pass result to callback when socket emits message event', function (done) {
      mocks.socket_on_message = ['<hudson><version>1.431</version><url>http://localhost:8080/</url><server-id>362f249fc053c1ede86a218587d100ce</server-id><slave-port>55328</slave-port></hudson>'];
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.discover('somehost', function cb(err, result) {
        checks.jenkins_discover_cb_args = cb['arguments'];
        done();
      });
      checks.socket_close__count.should.equal(1);
      checks.socket_on_message__args[0].should.equal('message');
      (typeof checks.socket_on_message__args[1]).should.equal('function');
      should.not.exist(checks.jenkins_discover_cb_args[0]);
      checks.jenkins_discover_cb_args[1].version.should.equal('1.431');
      checks.jenkins_discover_cb_args[1].url.should.equal('http://localhost:8080/');
    });

    it('should close socket and pass error to callback when an error occurs while sending a message', function (done) {
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.discover('somehost', function cb(err, result) {
        checks.jenkins_discover_cb_args = cb['arguments'];
        done();
      });
      checks.socket_send__args[5](new Error('someerror'));
      checks.socket_close__count.should.equal(1);
      checks.jenkins_discover_cb_args[0].message.should.equal('someerror');
    });
  });

  describe('executor', function () {

    beforeEach(function () {
      mocks.request_result = { statusCode: 200, body: JSON.stringify({
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
      })};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.executor(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
      });
    });

    afterEach(function () {
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/computer/api/json');
      checks.request_opts.qs.depth.should.equal(1);
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
    });

    it('should pass executor idle, stuck, and progress status when executor has them', function () {
      var data = checks.jenkins_dashboard_cb_args[1];
      data.master[0].progress.should.equal(88);
      data.master[0].stuck.should.equal(false);
      data.master[0].idle.should.equal(false);
      data.master[1].progress.should.equal(0);
      data.master[1].stuck.should.equal(false);
      data.master[1].idle.should.equal(true);
      data.slave[0].progress.should.equal(88);
      data.slave[0].stuck.should.equal(true);
      data.slave[0].idle.should.equal(false);
    });

    it('should leave executor name undefined when executor is idle', function () {
      var data = checks.jenkins_dashboard_cb_args[1];
      data.master[1].idle.should.equal(true);
      should.not.exist(data.master[1].name);
    });

    it('should pass executor name when executor is not idle', function () {
      var data = checks.jenkins_dashboard_cb_args[1];
      data.master[0].idle.should.equal(false);
      data.master[0].name.should.equal('job1');
      data.slave[0].idle.should.equal(false);
      data.slave[0].name.should.equal('job2');
    });
  });

  describe('job', function () {

    it('should pass job status and results when job exists', function (done) {
      mocks.request_result = { statusCode: 200, body: JSON.stringify({
        color: 'blue',
        healthReport: [
          { description: 'Coverage is 100%' },
          { description: 'All system is go!' }
        ]
      })};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.job('job1', function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/job/job1/api/json');
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      var data = checks.jenkins_dashboard_cb_args[1];
      data.status.should.equal('OK');
      data.reports.length.should.equal(2);
      data.reports[0].should.equal('Coverage is 100%');
      data.reports[1].should.equal('All system is go!');
    });

    it('should pass error when job does not exist', function (done) {
      mocks.request_result = { statusCode: 404, body: 'somenotfounderror'};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.job('job1', function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/job/job1/api/json');
      should.not.exist(checks.jenkins_dashboard_cb_args[1]);
      checks.jenkins_dashboard_cb_args[0].message.should.equal('Job job1 does not exist');
    });
  });

  describe('queue', function () {

    it('should pass job names when queue is not empty', function (done) {
      mocks.request_result = { statusCode: 200, body: JSON.stringify({
        items: [
          { task: { name: 'job1' }},
          { task: { name: 'job2' }}
        ]
      })};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.queue(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/queue/api/json');
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      checks.jenkins_dashboard_cb_args[1].length.should.equal(2);
      checks.jenkins_dashboard_cb_args[1][0].should.equal('job1');
      checks.jenkins_dashboard_cb_args[1][1].should.equal('job2');
    });

    it('should pass empty job names when queue is empty', function (done) {
      mocks.request_result = { statusCode: 200, body: JSON.stringify({
        items: []
      })};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.queue(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      checks.request_opts.method.should.equal('get');
      checks.request_opts.uri.should.equal('http://localhost:8080/queue/api/json');
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      checks.jenkins_dashboard_cb_args[1].length.should.equal(0);
    });
  });

  describe('version', function () {

    it('should pass error to callback when headers do not contain x-jenkins', function (done) {
      mocks.request_result = { statusCode: 200, headers: {}};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.version(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[1]);
      var err = checks.jenkins_dashboard_cb_args[0];
      err.message.should.equal('Not a Jenkins server');
    });

    it('should pass version to callback when headers contain x-jenkins', function (done) {
      mocks.request_result = { statusCode: 200, headers: { 'x-jenkins': '1.464' }};
      mocks.requires = {
        request: bag.mock.request(checks, mocks)
      };
      jenkins = new (create(checks, mocks))('http://localhost:8080');
      jenkins.version(function cb(err, result) {
        checks.jenkins_dashboard_cb_args = cb['arguments'];
        done();
      });
      should.not.exist(checks.jenkins_dashboard_cb_args[0]);
      var version = checks.jenkins_dashboard_cb_args[1];
      version.should.equal('1.464');
    });
  });
});
