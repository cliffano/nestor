var buster = require('buster-node'),
  ConsoleStream = require('../lib/consolestream'),
  referee = require('referee'),
  assert = referee.assert;

buster.testCase('consolestream - consolestream', {
  'should be readable but not writable': function () {
    var consoleStream = new ConsoleStream();
    assert.isTrue(consoleStream.readable);
    assert.isFalse(consoleStream.writable);
  }
});
