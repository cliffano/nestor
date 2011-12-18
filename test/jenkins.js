var assert = require('assert'),
  sandbox = require('sandboxed-module'),
  vows = require('vows');

vows.describe('jenkins').addBatch({
  '': {
    topic: function () {
      return {};
    },
    '': function (topic) {
    }
  }
}).exportTo(module);