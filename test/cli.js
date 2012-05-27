var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  cli;

describe('cli', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/cli', {
      requires: {
        bagofholding: {
          cli: {
            exitCb: function (errorCb, successCb) {
              // TODO: investigate why bag.mock.exitCb does not have the mock globals (console and process)
              if (!errorCb) {
                errorCb = function (err) {
                  bag.mock.console(checks).error(err.message);
                };
              }
              return function (err, result) {
                if (err) {
                  errorCb(err);
                } else {
                  successCb(result);
                }
              };
            },
            parse: function (commands, dir) {
              checks.bag_parse_commands = commands;
              checks.bag_parse_dir = dir;
            }
          }
        },
        './jenkins': function (url) {
          checks.jenkins_url = url;
          function _cb(cb) {
            cb(mocks.jenkins_action_err, mocks.jenkins_action_result);
          }
          return {
            build: function (jobName, params, cb) {
              checks.build_jobName = jobName;
              checks.build_params = params;
              _cb(cb);
            },
            dashboard: _cb,
            discover: function (host, cb) {
              checks.discover_host = host;
              _cb(cb);
            },
            executor: _cb,
            job: function (name, cb) {
              checks.job_name = name;
              _cb(cb);
            },
            queue: _cb,
            version: _cb
          };
        }
      },
      globals: {
        console: bag.mock.console(checks),
        process: bag.mock.process(checks, mocks)
      },
      locals: {
        __dirname: '/somedir/nestor/lib'
      }
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('exec', function () {

    beforeEach(function () {
      mocks.process_env = { JENKINS_URL: 'http://ci.jenkins-ci.org' };
    });

    afterEach(function () {
      checks.bag_parse_dir.should.equal('/somedir/nestor/lib');
      checks.jenkins_url.should.equal('http://ci.jenkins-ci.org');
    });

    it('should log job started successfully when exec build is called  and job exists', function () {
      mocks.jenkins_action_err = null;
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.build.desc.should.equal('Trigger build with optional parameters');
      checks.bag_parse_commands.build.action('job1', 'foo=bar&abc=xyz');
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Job job1 was started successfully');
    });

    it('should log job not found error when exec build is called and job does not exist', function () {
      mocks.jenkins_action_err = new Error('Job not found');
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.build.desc.should.equal('Trigger build with optional parameters');
      checks.bag_parse_commands.build.action('job1');
      checks.console_error_messages.length.should.equal(1);
      checks.console_error_messages[0].should.equal('Job not found');
    });

    it('should log jobs status and name when exec dashboard is called and Jenkins result has jobs', function () {
      mocks.jenkins_action_result = [
        { status: 'OK', name: 'job1' },
        { status: 'FAIL', name: 'job2' }
      ];
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.dashboard.desc.should.equal('View status of all jobs');
      checks.bag_parse_commands.dashboard.action();
      checks.console_log_messages.length.should.equal(2);
      checks.console_log_messages[0].should.equal('OK - job1');
      checks.console_log_messages[1].should.equal('FAIL - job2');
    });

    it('should log no job when exec dashboard is called and Jenkins result has no job', function () {
      mocks.jenkins_action_result = [];
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.dashboard.desc.should.equal('View status of all jobs');
      checks.bag_parse_commands.dashboard.action();
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Jobless Jenkins');
    });

    it('should log version and host when exec discover is called and there is a running Jenkins instance', function () {
      mocks.jenkins_action_result = {
        version: '1.2.3',
        url: 'http://localhost:8080/',
        'server-id': '362f249fc053c1ede86a218587d100ce',
        'slave-port': '55325'
      };
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.discover.desc.should.equal('Discover Jenkins instance running on a specified host');
      checks.bag_parse_commands.discover.action('localhost');
      checks.discover_host.should.equal('localhost');
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Jenkins ver. 1.2.3 is running on http://localhost:8080/');
    });

    it('should log executor status when exec executor is called and there are some executors', function () {
      mocks.jenkins_action_result = {
        master: [
          { idle: true },
          { idle: false, name: 'job1', progress: 5 },
          { idle: false, progress: 33 }
        ],
        slave: [
          { idle: false, stuck: true, name: 'job2' , progress: 11 }
        ]
      };
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.executor.desc.should.equal('View executors\' status (running builds)');
      checks.bag_parse_commands.executor.action();
      checks.console_log_messages.length.should.equal(6);
      checks.console_log_messages[0].should.equal('+ master');
      checks.console_log_messages[1].should.equal('  - idle');
      checks.console_log_messages[2].should.equal('  - job1 | 5%');
      checks.console_log_messages[3].should.equal('  - undefined | 33%');
      checks.console_log_messages[4].should.equal('+ slave');
      checks.console_log_messages[5].should.equal('  - job2 | 11% stuck!');
    });

    it('should log no executor found when exec executor is called and there is no executor', function () {
      mocks.jenkins_action_result = [];
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.executor.desc.should.equal('View executors\' status (running builds)');
      checks.bag_parse_commands.executor.action();
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('No executor found');
    });

    it('should log job name, status, and reports when job exists', function () {
      mocks.jenkins_action_result = {
        status: 'OK',
        reports: ['Coverage 100%', 'All good!']
      };
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.job.desc.should.equal('View job status reports');
      checks.bag_parse_commands.job.action('job1');
      checks.console_log_messages.length.should.equal(3);
      checks.console_log_messages[0].should.equal('job1 | OK');
      checks.console_log_messages[1].should.equal(' - Coverage 100%');
      checks.console_log_messages[2].should.equal(' - All good!');
    });

    it('should log job not found error when job does not exist', function () {
      mocks.jenkins_action_err = new Error('someerror');
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.job.desc.should.equal('View job status reports');
      checks.bag_parse_commands.job.action('job1');
      checks.console_error_messages.length.should.equal(1);
      checks.console_error_messages[0].should.equal('someerror');
    });

    it('should log queued job names when exec queue is called and there are some queued jobs', function () {
      mocks.jenkins_action_result = ['job1', 'job2'];
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.queue.desc.should.equal('View queued jobs');
      checks.bag_parse_commands.queue.action();
      checks.console_log_messages.length.should.equal(2);
      checks.console_log_messages[0].should.equal('- job1');
      checks.console_log_messages[1].should.equal('- job2');
    });

    it('should log queue empty message when exec queue is called and there is no queued job', function () {
      mocks.jenkins_action_result = [];
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.queue.desc.should.equal('View queued jobs');
      checks.bag_parse_commands.queue.action();
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Queue is empty');
    });

    it('should log version when exec ver is called and version exists', function () {
      mocks.jenkins_action_result = '1.2.3';
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.ver.desc.should.equal('View Jenkins version number');
      checks.bag_parse_commands.ver.action();
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Jenkins ver. 1.2.3');
    });

    it('should log error when exec ver is called and version does not exist', function () {
      mocks.jenkins_action_err = new Error('someerror');
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.ver.desc.should.equal('View Jenkins version number');
      checks.bag_parse_commands.ver.action();
      checks.console_error_messages.length.should.equal(1);
      checks.console_error_messages[0].should.equal('someerror');
    });
  });
});