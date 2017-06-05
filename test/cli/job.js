var buster     = require('buster-node');
var cli        = require('bagofcli');
var fs         = require('fs');
var Jenkins    = require('../../lib/jenkins');
var job        = require('../../lib/cli/job');
var proxyquire = require('proxyquire');
var referee    = require('referee');
var text       = require('bagoftext');
var assert     = referee.assert;

text.setLocale('en');

buster.testCase('cli - job', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockFs      = this.mock(fs);
    this.mockProcess = this.mock(process);

    var jenkins = new Jenkins('http://localhost:8080');
    this.mockArgsCb = function (args, cb) {
      cb(jenkins);
    };
  },
  'create - should log job created success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was created successfully', 'somejob');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'createJob', function (name, config, cb) {
      assert.equals(name, 'somejob');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    job.create(this.mockArgsCb)('somejob', 'config.xml');
  },
  'read - should log job status with correct color and health reports': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'somejob', 'ok'.blue);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport1');
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'readJob', function (name, cb) {
      assert.equals(name, 'somejob');
      var result = {
        color: 'blue',
        healthReport: [
          { description: 'somereport1' },
          { description: 'somereport2' }
        ]
      };
      cb(null, result);
    });

    job.read(this.mockArgsCb)('somejob');
  },
  'read - should log status as-is in grey color when color is status value': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'somejob', 'notbuilt'.grey);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport1');
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'readJob', function (name, cb) {
      assert.equals(name, 'somejob');
      var result = {
        color: 'notbuilt',
        healthReport: [
          { description: 'somereport1' },
          { description: 'somereport2' }
        ]
      };
      cb(null, result);
    });

    job.read(this.mockArgsCb)('somejob');
  },
  'readLatest - should display yellow building status and start time description': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'somejob', 'building'.yellow);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'Started sometime ago');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    var mockMoment = function () {
      return {
        fromNow: function() {
          return 'sometime ago';
        }
      };
    };
    var job = proxyquire('../../lib/cli/job.js', { moment: mockMoment });

    this.stub(Jenkins.prototype, 'readLatestJob', function (name, cb) {
      assert.equals(name, 'somejob');
      var result = {
        building: true,
        timestamp: 1422789191389
      };
      cb(null, result);
    });

    job.readLatest(this.mockArgsCb)('somejob');
  },
  'readLatest - should display completed status and finish time description': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'somejob', 'success'.green);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'Finished sometime ago');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    var mockMoment = function () {
      return {
        fromNow: function() {
          return 'sometime ago';
        }
      };
    };
    var job = proxyquire('../../lib/cli/job.js', { moment: mockMoment });

    this.stub(Jenkins.prototype, 'readLatestJob', function (name, cb) {
      assert.equals(name, 'somejob');
      var result = {
        building : false,
        result   : 'SUCCESS',
        timestamp: 1422789191389,
        duration : 10
      };
      cb(null, result);
    });

    job.readLatest(this.mockArgsCb)('somejob');
  },
  'update - should log job updated success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was updated successfully', 'somejob');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'updateJob', function (name, config, cb) {
      assert.equals(name, 'somejob');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    job.update(this.mockArgsCb)('somejob', 'config.xml');
  },
  'delete - should log job deleted success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was deleted successfully', 'somejob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'deleteJob', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.delete(this.mockArgsCb)('somejob', 'config.xml');
  },
  'build - should log job started success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was triggered successfully', 'somejob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'buildJob', function (name, params, cb) {
      assert.equals(name, 'somejob');
      assert.equals(params.param1, 'value1');
      assert.equals(params.param2, 'value2=2');
      assert.equals(params.param3, 'value3');
      cb();
    });

    job.build(this.mockArgsCb)('somejob', 'param1=value1&param2=value2=2&param3=value3', {});
  },
  'build - should pass to console call': function (done) {
    this.timeout = 3000;
    this.mockConsole.expects('log').once().withExactArgs('Job %s was triggered successfully', 'somejob');

    var self = this;
    this.stub(Jenkins.prototype, 'buildJob', function (name, params, cb) {
      assert.equals(name, 'somejob');
      assert.equals(params, {});
      cb(null, null, { headers: { location: 'somebuildurl' }});
    });

    this.stub(Jenkins.prototype, 'checkBuildStarted', function (buildUrl, cb) {
      assert.equals(buildUrl, 'somebuildurl');
      cb(true);
    });

    this.stub(Jenkins.prototype, 'streamJobConsole', function (name, buildNumber, interval, cb) {
      assert.equals(name, 'somejob');
      assert.equals(buildNumber, null);
      assert.equals(interval, 0);
      return {
        pipe: function (stream, opts) {
          assert.defined(stream);
          assert.equals(opts.end, false);
          done();
        }
      };
    });

    job.build(this.mockArgsCb)('somejob', { console: true });
  },
  'build - should wait until build starts before passing to console call': function (done) {
    this.timeout = 10000;
    this.mockConsole.expects('log').once().withExactArgs('Job %s was triggered successfully', 'somejob');
    this.mockConsole.expects('log').twice().withExactArgs('Waiting for job to start...');

    var self = this;
    this.stub(Jenkins.prototype, 'buildJob', function (name, params, cb) {
      assert.equals(name, 'somejob');
      assert.equals(params, {});
      cb(null, null, { headers: { location: 'somebuildurl' }});
    });

    var countdown = 3;
    this.stub(Jenkins.prototype, 'checkBuildStarted', function (buildUrl, cb) {
      assert.equals(buildUrl, 'somebuildurl');
      countdown--;
      cb(countdown === 0);
    });

    this.stub(Jenkins.prototype, 'streamJobConsole', function (name, buildNumber, interval, cb) {
      assert.equals(name, 'somejob');
      assert.equals(buildNumber, null);
      assert.equals(interval, 0);
      return {
        pipe: function (stream, opts) {
          assert.defined(stream);
          assert.equals(opts.end, false);
          done();
        }
      };
    });

    job.build(this.mockArgsCb)('somejob', { console: true });
  },
  'build - should give up after max retries and not stream old console': function (done) {
    this.timeout = 10000;
    this.mockConsole.expects('log').once().withExactArgs('Job %s was triggered successfully', 'somejob');
    this.mockConsole.expects('log').once().withExactArgs('Waiting for job to start...');
    this.mockConsole.expects('log').once().withExactArgs('Build didn\'t start after %d seconds, it\'s still waiting in the queue', 2);

    var self = this;
    this.stub(Jenkins.prototype, 'buildJob', function (name, params, cb) {
      cb(null, null, { headers: { location: 'somebuildurl' }});
    });

    this.stub(Jenkins.prototype, 'checkBuildStarted', function (buildUrl, cb) {
      cb(false);
    });

    this.stub(cli, 'exit', function (err, result) {
      done();
    });

    job.build(this.mockArgsCb)('somejob', { console: true, poll: 1 });
  },
  'build - should log job started success message with no args and no params': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was triggered successfully', 'somejob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'buildJob', function (name, params, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.build(this.mockArgsCb)('somejob', {});
  },
  'stop - should log job stopped success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was stopped successfully', 'somejob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'stopJob', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.stop(this.mockArgsCb)('somejob', 'config.xml');
  },
  'console - should pipe console output stream to stdout': function () {
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'streamJobConsole', function (name, buildNumber, interval, cb) {
      assert.equals(name, 'somejob');
      assert.equals(buildNumber, 123);
      return {
        pipe: function (stream, opts) {
          assert.defined(stream);
          assert.equals(opts.end, false);
          cb();
        }
      };
    });

    job.console(this.mockArgsCb)('somejob', 123, {});
  },
  'console - should pass null build number when none supplied': function () {
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'streamJobConsole', function (name, buildNumber, interval, cb) {
      assert.equals(name, 'somejob');
      assert.equals(buildNumber, null);
      return {
        pipe: function (stream, opts) {
          assert.defined(stream);
          assert.equals(opts.end, false);
          cb();
        }
      };
    });

    job.console(this.mockArgsCb)('somejob', {});
  },
  'enable - should log job enabled success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was enabled successfully', 'somejob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'enableJob', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.enable(this.mockArgsCb)('somejob');
  },
  'disable - should log job disabled success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was disabled successfully', 'somejob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'disableJob', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.disable(this.mockArgsCb)('somejob');
  },
  'copy - should log job copy success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was copied to job %s', 'existingjob', 'newjob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'copyJob', function (existingName, newName, cb) {
      assert.equals(existingName, 'existingjob');
      assert.equals(newName, 'newjob');
      cb();
    });

    job.copy(this.mockArgsCb)('existingjob', 'newjob');
  },
  'fetchConfig - should log configuration': function () {
    this.mockConsole.expects('log').once().withExactArgs('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'fetchJobConfig', function (name, cb) {
      assert.equals(name, 'somejob');
      cb(null, '<xml>some config</xml>');
    });

    job.fetchConfig(this.mockArgsCb)('somejob');
  }
});
