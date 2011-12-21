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
                  discover: function (hsot, cb) {
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
        cli = topic('build', { _: [ '', 'myjob', 'myparam=myvalue'] }, new Error('some error'), null, checks);
      cli.exec();
      assert.equal(checks.code, 1);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'some error');
    },
    'should pass exit code 0 when build callback has no error': function (topic) {
      var checks = {},
        cli = topic('build', { _: [ '', 'myjob', 'myparam=myvalue'] }, null, { status: 'ok' }, checks);
      cli.exec();
      assert.equal(checks.code, 0);
      assert.equal(checks.parseArgsCount, 1);
      assert.equal(checks.messages.length, 1);
      assert.equal(checks.messages[0], 'Job was started successfully');
    }
  }
}).exportTo(module);