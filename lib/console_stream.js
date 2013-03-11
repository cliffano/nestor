var inherits = require('util').inherits,
  Stream = require('stream').Stream;

function ConsoleStream() {}
inherits(ConsoleStream, Stream);

ConsoleStream.prototype.readable = true;
ConsoleStream.prototype.writable = false;

module.exports = ConsoleStream;
