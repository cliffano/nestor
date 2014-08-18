var buster  = require('buster-node');
var fs      = require('fs');
var Jenkins = require('../../lib/jenkins');
var job     = require('../../lib/cli/job');
var referee = require('referee');
var text    = require('bagoftext');
var assert  = referee.assert;

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
  'read - should log job status and health reports': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'somejob', 'OK'.blue);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport1');
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'readJob', function (name, cb) {
      assert.equals(name, 'somejob');
      var body = {
        color: 'blue',
        healthReport: [
          { description: 'somereport1' },
          { description: 'somereport2' }
        ]
      };
      cb(null, { body: JSON.stringify(body) });
    });

    job.read(this.mockArgsCb)('somejob');
  },
  'read - should log status as UNKNOWN in grey color when color is unsupported': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s | %s', 'somejob', 'UNKNOWN'.grey);
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport1');
    this.mockConsole.expects('log').once().withExactArgs(' - %s', 'somereport2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'readJob', function (name, cb) {
      assert.equals(name, 'somejob');
      var body = {
        color: 'fuchsia',
        healthReport: [
          { description: 'somereport1' },
          { description: 'somereport2' }
        ]
      };
      cb(null, { body: JSON.stringify(body) });
    });

    job.read(this.mockArgsCb)('somejob');
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
  'stop - should log job stopped success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('Job %s was stopped successfully', 'somejob');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'stopJob', function (name, cb) {
      assert.equals(name, 'somejob');
      cb();
    });

    job.stop(this.mockArgsCb)('somejob', 'config.xml');
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