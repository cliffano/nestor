var buster = require('buster'),
  ConsoleStream = require('../lib/consolestream');

buster.testCase('consolestream - consolestream', {
  'should be readable but not writable': function () {
    var consoleStream = new ConsoleStream();
    assert.isTrue(consoleStream.readable);
    assert.isFalse(consoleStream.writable);
  }
});