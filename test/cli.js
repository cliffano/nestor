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
            dashboard: _cb,
            discover: function (host, cb) {
              checks.discover_host = host;
              _cb(cb);
            },
            executor: _cb,
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
/*
    it('should log nothing when exec executor is called and there is no executor', function () {
      mocks.jenkins_action_result = [];
      cli = create(checks, mocks);
      cli.exec();
      checks.bag_parse_commands.executor.desc.should.equal('View executors\' status (running builds)');
      checks.bag_parse_commands.executor.action();
      checks.console_log_messages.length.should.equal(1);
      checks.console_log_messages[0].should.equal('Queue is empty');
    });
*/
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
 
/*
var assert = require('assert'),
  sandbox = require('sandboxed-module'),
  vows = require('vows');

vows.describe('cli').addBatch({
  'exec': {
    topic: function () {
      return function (command, args, mockErr, mockResult, checks) {
        checks.messages = [];
        return sandbox.require('../lib/cli', {
          requires: {
            './jenkins': {
              Jenkins: function () {
                return {
                  build: function (job, params, cb) {
                    if (command === 'build') {
                      assert.equal(job, 'myjob');
                      assert.equal(params, 'myparam=myvalue');
                      cb(mockErr, mockResult);
                    }
                  },
                  dashboard: function (cb) {
                    if (command === 'dashboard') {
                      cb(mockErr, mockResult);
                    }
                  },
                  discover: function (host, cb) {
                    if (command === 'discover') {
                      cb(mockErr, mockResult);
                    }
                  },
                  executor: function (cb) {
                    if (command === 'executor') {
                      cb(mockErr, mockResult);
                    }
                  },
                  job: function (_job, cb) {
                    if (command === 'job') {
                      cb(mockErr, mockResult);
                    }
                  },
                  queue: function (cb) {
                    if (command === 'queue') {
                      cb(mockErr, mockResult);
                    }
                  },
                  version: function (cb) {
                    if (command === 'version') {
                      cb(mockErr, mockResult);
                    }
                  }
                };
              }
            },
            nomnom: {
              scriptName: function (name) {
                assert.equal(name, 'nestor');
                return {
                  opts: function (scriptOpts) {
                    assert.equal(scriptOpts.version.string, '-v');
                    assert.isTrue(scriptOpts.version.flag);
                    assert.equal(scriptOpts.version.help, 'Nestor version number');
                    assert.equal(scriptOpts.version.callback(), '1.2.3');
                  }
                };
              },
              command: function (name) {
                return {
                  callback: function (cb) {
                    cb(args);
                  }
                };
              },
              parseArgs: function () {
                checks.parseArgsCount = 1;
              },
              getUsage: function () {
                return 'dummyusage instruction';
              }
            },
            fs: {
              readFileSync: function (file) {
                return '{ "version": "1.2.3" }';
              }
            }
          },
          globals: {
            process: {
              exit: function (code) {
                checks.code = code;
              },
              env: {
                JENKINS_URL: 'http://user:pass@localhost:8080'
              }
            },
            console: {
              error: function (message) {
                checks.messages.push(message);
              },
              log: function (message) {
                checks.messages.push(message);
              }
            }
          }
        });
      };
    },
    'should pass exit code 1 when build callback has an error': function (topic) {
      var checks = {},
        cli = topic('build', { _: ['', 'myjob', 'myparam=myvalue'] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'some error');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when build callback has no error': function (topic) {
      var checks = {},
        cli = topic('build', { _: ['', 'myjob', 'myparam=myvalue'] }, null, { status: 'ok' }, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'Job was started successfully');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 1 when dashboard callback has an error': function (topic) {
      var checks = {},
        cli = topic('dashboard', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'some error');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when dashboard callback has no error and display jobs status and name when they exist': function (topic) {
      var checks = {},
        cli = topic('dashboard', { _: [''] }, null, [{ status: 'OK', name: 'job1' }, { status: 'ABORT', name: 'job2' }], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 3);
      assert.equal(checks.messages[0], 'OK - job1');
      assert.equal(checks.messages[1], 'ABORT - job2');
      assert.equal(checks.messages[2], 'dummyusage instruction');
    },
    'should pass exit code 0 when dashboard callback has no error and display message when there is no job': function (topic) {
      var checks = {},
        cli = topic('dashboard', { _: [''] }, null, [], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'Jobless Jenkins');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 1 when discover callback has an error': function (topic) {
      var checks = {},
        cli = topic('discover', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'some error');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when discover callback has no error and display jenkins details': function (topic) {
      var checks = {},
        cli = topic('discover', { _: [''] }, null, { version: '1.41', url: 'http://localhost:8888/jenkins' }, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'Jenkins 1.41 found, running at http://localhost:8888/jenkins');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 1 when executor callback has an error': function (topic) {
      var checks = {},
        cli = topic('executor', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'some error');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when executor callback has no error and display jobs status': function (topic) {
      var checks = {},
        cli = topic('executor', { _: [''] }, null, { master: [{ idle: true }, { idle: false, progress: 23, name: 'job1' }]}, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 4);
      assert.equal(checks.messages[0], '+ master');
      assert.equal(checks.messages[1], '  - idle');
      assert.equal(checks.messages[2], '  - 23% job1');
      assert.equal(checks.messages[3], 'dummyusage instruction');
    },
    'should pass exit code 1 when job callback has an error': function (topic) {
      var checks = {},
        cli = topic('job', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'some error');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when job callback has no error and display job status and reports': function (topic) {
      var checks = {},
        cli = topic('job', { _: [''] }, null, { status: 'OK', reports:  ['It is awesome', 'All good'] }, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 4);
      assert.equal(checks.messages[0], 'Status: OK');
      assert.equal(checks.messages[1], 'It is awesome');
      assert.equal(checks.messages[2], 'All good');
      assert.equal(checks.messages[3], 'dummyusage instruction');
    },
    'should pass exit code 1 when queue callback has an error': function (topic) {
      var checks = {},
        cli = topic('queue', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'some error');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when queue callback has no error and display empty message when there is no queued job': function (topic) {
      var checks = {},
        cli = topic('queue', { _: [''] }, null, [], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'Queue is empty');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when queue callback has no error and display queued jobs': function (topic) {
      var checks = {},
        cli = topic('queue', { _: [''] }, null, ['job1', 'job2'], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 3);
      assert.equal(checks.messages[0], '- job1');
      assert.equal(checks.messages[1], '- job2');
      assert.equal(checks.messages[2], 'dummyusage instruction');
    },
    'should pass exit code 1 when version callback has an error': function (topic) {
      var checks = {},
        cli = topic('version', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'some error');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    },
    'should pass exit code 0 when version callback has no error and display version number': function (topic) {
      var checks = {},
        cli = topic('version', { _: [''] }, null, '1.431', checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], '1.431');
      assert.equal(checks.messages[1], 'dummyusage instruction');
    }
  }
}).exportTo(module);
*/
