var buster  = require('buster-node');
var fs      = require('fs');
var Jenkins = require('../../lib/jenkins');
var jenkins = require('../../lib/cli/jenkins');
var referee = require('referee');
var text    = require('bagoftext');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('cli - jenkins', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);

    var jenkins = new Jenkins('http://localhost:8080');
    this.mockArgsCb = function (args, cb) {
      cb(jenkins);
    };
  },
  'dashboard - should log Jobless Jenkins when exec dashboard is called and there is no job': function () {
    this.mockConsole.expects('log').once().withExactArgs('Jobless Jenkins');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'info', function (cb) {
      var result = { jobs: [] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockArgsCb)();
  },
  'dashboard - should log statuses when exec dashboard is called and Jenkins has running jobs': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'ok'.blue, 'job1');
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'ok'.green, 'job2');
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'aborted'.grey, 'job3');
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'fail'.red, 'job4');
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'warn'.yellow, 'job5');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'info', function (cb) {
      var result = { jobs: [
          { name: 'job1', color: 'blue' },
          { name: 'job2', color: 'green' },
          { name: 'job3', color: 'grey' },
          { name: 'job4', color: 'red' },
          { name: 'job5', color: 'yellow' }
        ] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockArgsCb)();
  },
  'dashboard - should log statuses when exec dashboard is called and Jenkins has running jobs with animated value': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'aborted'.grey, 'job1');
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'fail'.red, 'job2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'info', function (cb) {
      var result = { jobs: [
          { name: 'job1', color: 'grey_anime' },
          { name: 'job2', color: 'red_anime' },
        ] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockArgsCb)();
  },
  'dashboard - should log statuses when exec dashboard is called and Jenkins has running jobs with unknown color value': function () {
    this.mockConsole.expects('log').once().withExactArgs('%s - %s', 'someunknownstatus'.grey, 'job1');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'info', function (cb) {
      var result = { jobs: [
          { name: 'job1', color: 'someunknownstatus' }
        ] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockArgsCb)();
  },
  'discover - should log version and url when exec discover is called and there is a running Jenkins instance': function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. %s is running on %s', '1.2.3', 'http://localhost:8080/');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });

    jenkins.discover(this.mockArgsCb)();
  },
  'discover - should log version and url when exec discover is called with specified host': function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. %s is running on %s', '1.2.3', 'http://localhost:8080/');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'somehost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });

    jenkins.discover(this.mockArgsCb)('somehost', {});
  },
  'discover - should log host instead of url when exec discover result does not include any url': function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. %s is running on %s', '1.2.3', 'localhost');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });

    jenkins.discover(this.mockArgsCb)();
  },
  'executor - should log no executor found when exec executor is called and there is no executor': function () {
    this.mockConsole.expects('log').once().withExactArgs('No executor found');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'computer', function (cb) {
      var result = { computer: [] };
      cb(null, result);
    });

    jenkins.executor(this.mockArgsCb)();
  },
  'executor - should pass correct idle, stuck, and progress status': function () {
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'master', '1 active, 1 idle');
    this.mockConsole.expects('log').once().withExactArgs('  - %s | %s%%s', 'job1', 88, '');
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'slave1', '1 active');
    this.mockConsole.expects('log').once().withExactArgs('  - %s | %s%%s', 'job2', 88, ' stuck!');
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'slave2', '1 idle');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'computer', function (cb) {
      var result = { computer: [
          {
            displayName: 'master',
            executors: [
              { idle: false, likelyStuck: false, progress: 88, currentExecutable: { url: 'http://localhost:8080/job/job1/19/' } },
              { idle: true, likelyStuck: false, progress: 0 }
            ]
          },
          {
            displayName: 'slave1',
            executors: [
              { idle: false, likelyStuck: true, progress: 88, currentExecutable: { url: 'http://localhost:8080/job/job2/30/' } }
            ]
          },
          {
            displayName: 'slave2',
            executors: [
              { idle: true, likelyStuck: false, progress: 0 }
            ]
          }
        ]};
      cb(null, result);
    });

    jenkins.executor(this.mockArgsCb)();
  },
  'feed - should parse job feed when job arg is provided': function () {
    this.mockConsole.expects('log').once().withExactArgs('Some title 1');
    this.mockConsole.expects('log').once().withExactArgs('Some title 2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'parseJobFeed', function (name, cb) {
      assert.equals(name, 'somejob');
      var result = [
        { title: 'Some title 1' },
        { title: 'Some title 2' }
      ];
      cb(null, result);
    });

    jenkins.feed(this.mockArgsCb)({ job: 'somejob' });
  },
  'feed - should parse view feed when view arg is provided': function () {
    this.mockConsole.expects('log').once().withExactArgs('Some title 1');
    this.mockConsole.expects('log').once().withExactArgs('Some title 2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'parseViewFeed', function (name, cb) {
      assert.equals(name, 'someview');
      var result = [
        { title: 'Some title 1' },
        { title: 'Some title 2' }
      ];
      cb(null, result);
    });

    jenkins.feed(this.mockArgsCb)({ view: 'someview' });
  },
  'feed - should parse Jenkins feed when neither job or view arg is provided': function () {
    this.mockConsole.expects('log').once().withExactArgs('Some title 1');
    this.mockConsole.expects('log').once().withExactArgs('Some title 2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'parseFeed', function (cb) {
      var result = [
        { title: 'Some title 1' },
        { title: 'Some title 2' }
      ];
      cb(null, result);
    });

    jenkins.feed(this.mockArgsCb)({});
  },
  'queue - should log queue empty message when there is no item': function () {
    this.mockConsole.expects('log').once().withExactArgs('Queue is empty');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'queue', function (cb) {
      var result = { items: [] };
      cb(null, JSON.stringify(result));
    });

    jenkins.queue(this.mockArgsCb)();
  },
  'queue - should log job names when result contains items': function () {
    this.mockConsole.expects('log').once().withExactArgs('- %s', 'job1');
    this.mockConsole.expects('log').once().withExactArgs('- %s', 'job2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'queue', function (cb) {
      var result = { items: [
        { task: { name: 'job1' }},
        { task: { name: 'job2' }}
        ] };
      cb(null, result);
    });

    jenkins.queue(this.mockArgsCb)();
  },
  'version - should log version when exec ver is called and version exists': function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. 1.2.3');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'version', function (cb) {
      cb(null, '1.2.3');
    });

    jenkins.version(this.mockArgsCb)();
  }
});