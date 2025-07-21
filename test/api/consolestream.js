"use strict";
/* eslint no-unused-vars: 0 */
import ConsoleStream from '../../lib/api/consolestream.js';
import referee from '@sinonjs/referee';
const assert = referee.assert;

describe('consolestream - consolestream', function() {
  it('should be readable but not writable', function () {
    const consoleStream = new ConsoleStream();
    assert.isTrue(consoleStream.readable);
    assert.isFalse(consoleStream.writable);
  });
});
