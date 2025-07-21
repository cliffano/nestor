"use strict";
import stream from 'stream';
import util from 'util';

/**
 * class ConsoleStream
 * Used for streaming Jenkins console output.
 */
class ConsoleStream {
  constructor() {
    stream.Stream.call(this);
    this.readable = true;
    this.writable = false;
  }
}

util.inherits(ConsoleStream, stream.Stream);

// ConsoleStream.prototype.readable = true;
// ConsoleStream.prototype.writable = false;

// const exports = {
//   ConsoleStream: ConsoleStream
// };
  
export {
  ConsoleStream as default
};