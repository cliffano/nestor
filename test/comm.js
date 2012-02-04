var assert = require('assert'),
  sandbox = require('sandboxed-module'),
  url = require('url'),
  vows = require('vows');

vows.describe('comm').addBatch({
  'http': {
    topic: function () {
      return function (mocks) {
        return sandbox.require('../lib/comm', mocks);
      };
    },
    'when there is an error and url contains username, password, and path': {
      topic: function (topic) {
        topic({
          requires: {
            http: {
              request: function (opts, cb) {
                assert.equal(opts.path, '/jenkins/api/json');
                assert.equal(opts.method, 'GET');
                assert.equal(opts.host, 'localhost');
                assert.equal(opts.port, 8080);
                assert.equal(opts.headers.Authorization, 'Basic dXNlcjpwYXNz');
                return {
                  on: function (event, cb) {
                    if (event === 'error') {
                      cb(new Error('some error'));
                    }
                  },
                  end: function () {
                  }
                };
              }
            }
          }
        }).http('/api/json', 'GET', url.parse('http://user:pass@localhost:8080/jenkins'), this.callback);
      },
      'then the error should be passed via callback': function (err, result) {
        assert.equal(err.message, 'some error');
        assert.isUndefined(result);
      }
    },
    'when there is no error': {
      topic: function (topic) {
        topic({
          requires: {
            http: {
              request: function (opts, cb) {
                assert.equal(opts.path, '/api/json');
                assert.equal(opts.method, 'GET');
                assert.equal(opts.host, 'localhost');
                assert.equal(opts.port, 8080);
                assert.isNull(opts.headers);
                return {
                  on: function (event, cb) {
                  },
                  end: function () {
                    cb({
                      statusCode: 200,
                      headers: ['some header'],
                      setEncoding: function (encoding) {
                        assert.equal(encoding, 'utf8');
                      },
                      on: function (event, cb) {
                        if (event === 'data') {
                          cb('some data');
                        } else if (event === 'end') {
                          cb();
                        }
                      }
                    });
                  }
                };
              }
            }
          }
        }).http('/api/json', 'GET', url.parse('http://localhost:8080'), this.callback);
      },
      'then the result should be passed via callback': function (err, result) {
        assert.equal(result.statusCode, 200);
        assert.equal(result.headers.length, 1);
        assert.equal(result.headers[0], 'some header');
        assert.equal(result.data, 'some data');
        assert.isNull(err);
      }
    }
  },
  'udp': {
    topic: function () {
      return function (mocks) {
        return sandbox.require('../lib/comm', mocks);
      };
    },
    'when there is an error event': {
      topic: function (topic) {
        topic({
          requires: {
            dgram: {
              createSocket: function (type) {
                assert.equal(type, 'udp4');
                return {
                  on: function (event, cb) {
                    if (event === 'error') {
                      cb(new Error('some error'));
                    }
                  },
                  close: function () {
                  },
                  send: function (buffer, start, end, port, host, cb) {
                  }
                };
              }
            }
          }
        }).udp('Long Live Jenkins', 'localhost', 8080, this.callback);
      },
      'then the error should be passed via callback': function (err, result) {
        assert.equal(err.message, 'some error');
        assert.isUndefined(result);
      }
    },
    'when there is an error on socket send': {
      topic: function (topic) {
        topic({
          requires: {
            dgram: {
              createSocket: function (type) {
                assert.equal(type, 'udp4');
                return {
                  on: function (event, cb) {
                  },
                  close: function () {
                  },
                  send: function (buffer, start, end, port, host, cb) {
                    cb(new Error('some error'));
                  }
                };
              }
            }
          }
        }).udp('Long Live Jenkins', 'localhost', 8080, this.callback);
      },
      'then the error should be passed via callback': function (err, result) {
        assert.equal(err.message, 'some error');
        assert.isUndefined(result);
      }
    },
    'when there is no error': {
      topic: function (topic) {
        topic({
          requires: {
            xml2js: {
              Parser: function () {
                return {
                  addListener: function (event, cb) {
                    cb('some data');
                  },
                  parseString: function (data) {
                  }
                };
              }
            },
            dgram: {
              createSocket: function (type) {
                assert.equal(type, 'udp4');
                return {
                  on: function (event, cb) {
                    if (event === 'message') {
                      cb('some data');
                    }
                  },
                  close: function () {
                  },
                  send: function (buffer, start, end, port, host, cb) {
                  }
                };
              }
            }
          }
        }).udp('Long Live Jenkins', 'localhost', 8080, this.callback);
      },
      'then the data should be passed via callback': function (err, result) {
        assert.equal(result, 'some data');
        assert.isNull(err);
      }
    }
  }
}).exportTo(module);