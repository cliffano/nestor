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
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when build callback has no error': function (topic) {
      var checks = {},
        cli = topic('build', { _: ['', 'myjob', 'myparam=myvalue'] }, null, { status: 'ok' }, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'Job was started successfully');
    },
    'should pass exit code 1 when dashboard callback has an error': function (topic) {
      var checks = {},
        cli = topic('dashboard', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when dashboard callback has no error and display jobs status and name when they exist': function (topic) {
      var checks = {},
        cli = topic('dashboard', { _: [''] }, null, [{ status: 'OK', name: 'job1' }, { status: 'ABORT', name: 'job2' }], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], 'OK - job1');
      assert.equal(checks.messages[1], 'ABORT - job2');
    },
    'should pass exit code 0 when dashboard callback has no error and display message when there is no job': function (topic) {
      var checks = {},
        cli = topic('dashboard', { _: [''] }, null, [], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'Jobless Jenkins');
    },
    'should pass exit code 1 when discover callback has an error': function (topic) {
      var checks = {},
        cli = topic('discover', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when discover callback has no error and display jenkins details': function (topic) {
      var checks = {},
        cli = topic('discover', { _: [''] }, null, { version: '1.41', url: 'http://localhost:8888/jenkins' }, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'Jenkins 1.41 found, running at http://localhost:8888/jenkins');
    },
    'should pass exit code 1 when executor callback has an error': function (topic) {
      var checks = {},
        cli = topic('executor', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when executor callback has no error and display jobs status': function (topic) {
      var checks = {},
        cli = topic('executor', { _: [''] }, null, { master: [{ idle: true }, { idle: false, progress: 23, name: 'job1' }]}, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 3);
      assert.equal(checks.messages[0], '+ master');
      assert.equal(checks.messages[1], '  - idle');
      assert.equal(checks.messages[2], '  - 23% job1');
    },
    'should pass exit code 1 when job callback has an error': function (topic) {
      var checks = {},
        cli = topic('job', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when job callback has no error and display job status and reports': function (topic) {
      var checks = {},
        cli = topic('job', { _: [''] }, null, { status: 'OK', reports:  ['It is awesome', 'All good'] }, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 3);
      assert.equal(checks.messages[0], 'Status: OK');
      assert.equal(checks.messages[1], 'It is awesome');
      assert.equal(checks.messages[2], 'All good');
    },
    'should pass exit code 1 when queue callback has an error': function (topic) {
      var checks = {},
        cli = topic('queue', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when queue callback has no error and display empty message when there is no queued job': function (topic) {
      var checks = {},
        cli = topic('queue', { _: [''] }, null, [], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'Queue is empty');
    },
    'should pass exit code 0 when queue callback has no error and display queued jobs': function (topic) {
      var checks = {},
        cli = topic('queue', { _: [''] }, null, ['job1', 'job2'], checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 2);
      assert.equal(checks.messages[0], '- job1');
      assert.equal(checks.messages[1], '- job2');
    },
    'should pass exit code 1 when version callback has an error': function (topic) {
      var checks = {},
        cli = topic('version', { _: [''] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when version callback has no error and display version number': function (topic) {
      var checks = {},
        cli = topic('version', { _: [''] }, null, '1.431', checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], '1.431');
    }
  }
}).exportTo(module);