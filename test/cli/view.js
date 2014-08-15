var buster  = require('buster-node');
var fs      = require('fs');
var Jenkins = require('../../lib/jenkins');
var view    = require('../../lib/cli/view');
var referee = require('referee');
var text    = require('bagoftext');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('cli - view', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockFs      = this.mock(fs);
    this.mockProcess = this.mock(process);

    var jenkins = new Jenkins('http://localhost:8080');
    this.mockArgsCb = function (args, cb) {
      cb(jenkins);
    };
  },
  'create - should log view created success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('View %s was created successfully', 'someview');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'createView', function (name, config, cb) {
      assert.equals(name, 'someview');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    view.create(this.mockArgsCb)('someview', 'config.xml');
  },
  'update - should log view updated success message': function () {
    this.mockConsole.expects('log').once().withExactArgs('View %s was updated successfully', 'someview');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'updateView', function (name, config, cb) {
      assert.equals(name, 'someview');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    view.update(this.mockArgsCb)('someview', 'config.xml');
  },
  'fetchConfig - should log configuration': function () {
    this.mockConsole.expects('log').once().withExactArgs('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    this.stub(Jenkins.prototype, 'fetchViewConfig', function (name, cb) {
      assert.equals(name, 'someview');
      cb(null, '<xml>some config</xml>');
    });

    view.fetchConfig(this.mockArgsCb)('someview');
  }
});