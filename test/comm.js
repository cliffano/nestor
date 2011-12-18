var assert = require('assert'),
  sandbox = require('sandboxed-module'),
  vows = require('vows');

vows.describe('comm').addBatch({
  'udp': {
    topic: function () {
      return function (mocks) {
        return sandbox.require('../lib/comm', mocks);
      };
    },
    'when there is a socket error': {
      topic: function (topic) {
        topic({
          requires: {
            dgram: {
              createSocket: function (type) {
                assert.equal(type, 'udp4');
                return {
                  on: function (event, cb) {
                    if (event === 'error') {
                      assert.equal(event, 'message');
                      cb(new Error('some error'));
                    }
                  },
                  close: function () {
                  }
                };
              }
            }
          }
        }).udp('Long Live Jenkins', 'localhost', 8080, this.callback);
      },
      'then an error should be passed via callback': function (error, result) {
        assert.equal(err.message, 'some error');
      }
    }
  }
}).exportTo(module);