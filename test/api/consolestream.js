var buster = require('buster-node');
var ConsoleStream = require('../../lib/api/consolestream');
var referee = require('referee');
var assert = referee.assert;

buster.testCase('consolestream - consolestream', {
  'should be readable but not writable': function () {
    var consoleStream = new ConsoleStream();
    assert.isTrue(consoleStream.readable);
    assert.isFalse(consoleStream.writable);
  }
});
