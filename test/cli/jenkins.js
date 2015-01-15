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
      cb(null, JSON.stringify(result));
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