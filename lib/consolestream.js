var stream = require('stream'),
  util = require('util');

/**
 * class ConsoleStream
 * Used for streaming Jenkins console output.
 */
function ConsoleStream() {}

util.inherits(ConsoleStream, stream.Stream);

ConsoleStream.prototype.readable = true;
ConsoleStream.prototype.writable = false;

module.exports = ConsoleStream;