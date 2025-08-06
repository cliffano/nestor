"use strict";
/* eslint no-unused-vars: 0 */
import cli from 'bagofcli';
import fs from 'fs';
import Jenkins from '../../lib/jenkins.js';
import job from '../../lib/cli/job.js';
import referee from '@sinonjs/referee';
import sinon from 'sinon';
const assert = referee.assert;
const refute = referee.refute;

describe('cli - job', function() {
  beforeEach(function (done) {
    this.mockConsole = sinon.mock(console);
    this.mockFs = sinon.mock(fs);
    this.mockProcess = sinon.mock(process);

    const jenkins = new Jenkins('http://localhost:8080');
    this.mockCb = function (command, cb) {
      // This jenkins constant is getting stubbed in the test functions
      cb(jenkins);
    };
    done();
  });
  afterEach(function (done) {
    this.mockConsole.verify();
    this.mockFs.verify();
    this.mockProcess.verify();
    sinon.restore();
    done();
  });
  it('create - should log job created success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job somejob was created successfully');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'createJob').value(function (name, config, cb) {
      assert.equals(name, 'somejob');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    job.create(this.mockCb)(null, ['somejob', 'config.xml']);
  });
  it('read - should log job status with correct color and health reports', function () {
    const status = 'ok'.blue;
    this.mockConsole.expects('log').once().withExactArgs(`somejob | ${status}`);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport1');
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'readJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      const result = {
        color: 'blue',
        healthReport: [
          { description: 'somereport1' },
          { description: 'somereport2' }
        ]
      };
      cb(null, result);
    });

    job.read(this.mockCb)(null, ['somejob']);
  });
  it('read - should log status as-is in grey color when color is status value', function () {
    const status = 'notbuilt'.grey;
    this.mockConsole.expects('log').once().withExactArgs(`somejob | ${status}`);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport1');
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'readJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      const result = {
        color: 'notbuilt',
        healthReport: [
          { description: 'somereport1' },
          { description: 'somereport2' }
        ]
      };
      cb(null, result);
    });

    job.read(this.mockCb)(null, ['somejob']);
  });
  it('readLatest - should display yellow building status and start time description', function () {
    const status = 'building'.yellow;
    this.mockConsole.expects('log').once().withExactArgs(`somejob | ${status}`);
    this.mockConsole.expects('log').once().withExactArgs(sinon.match(new RegExp(' - Started .* ago')));
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'readLatestJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      const result = {
        building: true,
        timestamp: 1422789191389
      };
      cb(null, result);
    });

    job.readLatest(this.mockCb)(null, ['somejob']);
  });
  it('readLatest - should display completed status and finish time description', function () {
    const status = 'success'.green;
    this.mockConsole.expects('log').once().withExactArgs(`somejob | ${status}`);
    this.mockConsole.expects('log').once().withExactArgs(sinon.match(new RegExp(' - Finished .* ago')));
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'readLatestJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      const result = {
        building : false,
        result   : 'SUCCESS',
        timestamp: 1422789191389,
        duration : 10
      };
      cb(null, result);
    });

    job.readLatest(this.mockCb)(null, ['somejob']);
  });
  it('update - should log job updated success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job somejob was updated successfully');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'updateJob').value(function (name, config, cb) {
      assert.equals(name, 'somejob');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    job.update(this.mockCb)(null, ['somejob', 'config.xml']);
  });
  it('delete - should log job deleted success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job somejob was deleted successfully');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'deleteJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.delete(this.mockCb)(null, ['somejob']);
  });
  // it('build - should log job started success message', function () {
  //   this.mockConsole.expects('log').once().withExactArgs('Job somejob was triggered successfully');
  //   this.mockProcess.expects('exit').once().withExactArgs(0);

  //   sinon.stub(Jenkins.prototype, 'buildJob').value(function (name, params, cb) {
  //     assert.equals(name, 'somejob');
  //     assert.equals(params.param1, 'value1');
  //     assert.equals(params.param2, 'value2');
  //     assert.equals(params.param3, 'value3');
  //     cb();
  //   });

  //   job.build(this.mockCb)(null, ['somejob', 'param1=value1&param2=value2&param3=value3']);
  // });
  // it('build - should pass to console call', function (done) {
  //   this.timeout = 3000;
  //   this.mockConsole.expects('log').once().withExactArgs('Job somejob was triggered successfully');

  //   const self = this;
  //   sinon.stub(Jenkins.prototype, 'buildJob').value(function (name, params, cb) {
  //     assert.equals(name, 'somejob');
  //     assert.equals(params, {});
  //     cb(null, null, { headers: { location: 'somebuildurl' }});
  //   });

  //   sinon.stub(Jenkins.prototype, 'checkBuildStarted').value(function (buildUrl, cb) {
  //     assert.equals(buildUrl, 'somebuildurl');
  //     cb(true);
  //   });

  //   sinon.stub(Jenkins.prototype, 'streamJobConsole').value(function (name, buildNumber, interval, cb) {
  //     assert.equals(name, 'somejob');
  //     assert.equals(buildNumber, null);
  //     assert.equals(interval, 0);
  //     return {
  //       pipe: function (stream, opts) {
  //         refute.isUndefined(stream);
  //         assert.equals(opts.end, false);
  //         done();
  //       }
  //     };
  //   });

  //   job.build(this.mockCb)({ console: true }, ['somejob']);
  // });
  // it('build - should wait until build starts before passing to console call', function (done) {
  //   this.timeout = 10000;
  //   this.mockConsole.expects('log').once().withExactArgs('Job somejob was triggered successfully');
  //   this.mockConsole.expects('log').twice().withExactArgs('Waiting for job to start...');

  //   const self = this;
  //   sinon.stub(Jenkins.prototype, 'buildJob').value(function (name, params, cb) {
  //     assert.equals(name, 'somejob');
  //     assert.equals(params, {});
  //     cb(null, null, { headers: { location: 'somebuildurl' }});
  //   });

  //   let countdown = 3;
  //   sinon.stub(Jenkins.prototype, 'checkBuildStarted').value(function (buildUrl, cb) {
  //     assert.equals(buildUrl, 'somebuildurl');
  //     countdown--;
  //     cb(countdown === 0);
  //   });

  //   sinon.stub(Jenkins.prototype, 'streamJobConsole').value(function (name, buildNumber, interval, cb) {
  //     assert.equals(name, 'somejob');
  //     assert.equals(buildNumber, null);
  //     assert.equals(interval, 0);
  //     return {
  //       pipe: function (stream, opts) {
  //         refute.isUndefined(stream);
  //         assert.equals(opts.end, false);
  //         done();
  //       }
  //     };
  //   });

  //   job.build(this.mockCb)({ console: true }, ['somejob']);
  // });
  // it('build - should give up after max retries and not stream old console', function (done) {
  //   this.timeout = 10000;
  //   this.mockConsole.expects('log').once().withExactArgs('Job somejob was triggered successfully');
  //   this.mockConsole.expects('log').once().withExactArgs('Waiting for job to start...');
  //   this.mockConsole.expects('log').once().withExactArgs('Build didn\'t start after %d seconds, it\'s still waiting in the queue', 2);

  //   const self = this;
  //   sinon.stub(Jenkins.prototype, 'buildJob').value(function (name, params, cb) {
  //     cb(null, null, { headers: { location: 'somebuildurl' }});
  //   });

  //   sinon.stub(Jenkins.prototype, 'checkBuildStarted').value(function (buildUrl, cb) {
  //     cb(false);
  //   });

  //   sinon.stub(cli, 'exit').value(function (err, result) {
  //     done();
  //   });

  //   job.build(this.mockCb)({ console: true, poll: 1 }, ['somejob']);
  // });
  it('build - should log job started success message with no command and no params', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job somejob was triggered successfully');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'buildJob').value(function (name, params, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.build(this.mockCb)({}, ['somejob']);
  });
  it('stop - should log job stopped success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job somejob was stopped successfully');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'stopJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.stop(this.mockCb)(null, ['somejob']);
  });
  it('console - should pipe console output stream to stdout', function () {
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'streamJobConsole').value(function (name, buildNumber, interval, cb) {
      assert.equals(name, 'somejob');
      assert.equals(buildNumber, 123);
      return {
        pipe: function (stream, opts) {
          refute.isUndefined(stream);
          assert.equals(opts.end, false);
          cb();
        }
      };
    });

    job.console(this.mockCb)({}, ['somejob', 123]);
  });
  // it('console - should pass null build number when none supplied', function () {
  //   this.mockProcess.expects('exit').once().withExactArgs(0);

  //   sinon.stub(Jenkins.prototype, 'streamJobConsole').value(function (name, buildNumber, interval, cb) {
  //     assert.equals(name, 'somejob');
  //     assert.equals(buildNumber, null);
  //     return {
  //       pipe: function (stream, opts) {
  //         refute.isUndefined(stream);
  //         assert.equals(opts.end, false);
  //         cb();
  //       }
  //     };
  //   });

  //   job.console(this.mockCb)({}, ['somejob']);
  // });
  it('enable - should log job enabled success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job somejob was enabled successfully');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'enableJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.enable(this.mockCb)(null, ['somejob']);
  });
  it('disable - should log job disabled success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job somejob was disabled successfully');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'disableJob').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.disable(this.mockCb)(null, ['somejob']);
  });
  it('copy - should log job copy success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('Job existingjob was copied to job newjob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'copyJob').value(function (existingName, newName, cb) {
      assert.equals(existingName, 'existingjob');
      assert.equals(newName, 'newjob');
      cb();
    });

    job.copy(this.mockCb)(null, ['existingjob', 'newjob']);
  });
  it('fetchConfig - should log configuration', function () {
    this.mockConsole.expects('log').once().withExactArgs('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'fetchJobConfig').value(function (name, cb) {
      assert.equals(name, 'somejob');
      cb(null, '<xml>some config</xml>');
    });

    job.fetchConfig(this.mockCb)(null, ['somejob']);
  });
});
