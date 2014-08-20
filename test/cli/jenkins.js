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
  'readQueue - should log queue empty message when there is no item': function () {
    this.mockConsole.expects('log').once().withExactArgs('Queue is empty');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'readQueue', function (cb) {
      var result = { items: [] };
      cb(null, JSON.stringify(result));
    });

    jenkins.readQueue(this.mockArgsCb)();
  },
  'readQueue - should log job names when result contains items': function () {
    this.mockConsole.expects('log').once().withExactArgs('- %s', 'job1');
    this.mockConsole.expects('log').once().withExactArgs('- %s', 'job2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'readQueue', function (cb) {
      var result = { items: [
        { task: { name: 'job1' }},
        { task: { name: 'job2' }}
        ] };
      cb(null, JSON.stringify(result));
    });

    jenkins.readQueue(this.mockArgsCb)();
  }
});