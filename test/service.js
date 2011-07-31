var assert = require('assert'),
    Service = require('../lib/service').Service,
    vows = require('vows');

vows.describe('Service').addBatch({
    'send': {
        'should call success callback when there is no error on http send': function (topic) {
            var _statusCode, _headers, _data, _options, _encoding, _reqOnCount = 0, _reqEndCount = 0,
                successCb = function (statusCode, headers, data) {
                    _statusCode = statusCode;
                    _headers = headers;
                    _data = data;
                },
                errorCb = function (err) {
                    assert.fail('Error callback should not have been called.');
                },
                req = {
                    on: function (event, cb) {
                        if (event === 'error') {
                            _reqOnCount += 1;
                        }
                    },
                    end: function () {
                        _reqEndCount += 1;
                    }
                },
                res = {
                    statusCode: 200,
                    headers: { 'headerfield': 'headervalue' },
                    setEncoding: function (encoding) {
                        _encoding = encoding;
                    },
                    on: function (event, cb) {
                        if (event === 'data') {
                            cb(JSON.stringify({ 'datafield': 'datavalue' }));
                        } else if (event === 'end') {
                            cb();
                        }
                    }
                },
                http = {
                    request: function (options, cb) {
                        _options = options;
                        cb(res);
                        return req;
                    }
                },
                service = new Service('http://user:pass@localhost:8080', http, null);
            service.sendHttp('/api/json', 'GET', successCb, errorCb);
            assert.equal(_options.host, 'localhost');
            assert.equal(_options.port, 8080);
            assert.equal(_options.path, '/api/json');
            assert.equal(_options.method, 'GET');
            assert.equal(_options.headers.Authorization, 'Basic dXNlcjpwYXNz');
            assert.equal(_reqOnCount, 1);
            assert.equal(_reqEndCount, 1);
            assert.equal(_encoding, 'utf8');
            assert.equal(_statusCode, 200);
            assert.equal(_headers.headerfield, 'headervalue');
            assert.equal(_data, '{"datafield":"datavalue"}');
        },
        'should call error callback when there is an error on http send': function (topic) {
            var _err, _options, _reqEndCount = 0,
                successCb = function (headers, data) {
                    assert.fail('Success callback should not have been called.');
                },
                errorCb = function (err) {
                    _err = err;
                },
                req = {
                    on: function (event, cb) {
                        if (event === 'error') {
                            errorCb(new Error('Unable to send request!'));
                        }
                    },
                    end: function () {
                        _reqEndCount += 1;
                    }
                },
                http = {
                    request: function (options, cb) {
                        _options = options;
                        return req;
                    }
                },
                service = new Service('http://localhost:8080', http, null);
            service.sendHttp('/api/json', 'GET', successCb, errorCb);
            assert.equal(_options.host, 'localhost');
            assert.equal(_options.port, 8080);
            assert.equal(_options.path, '/api/json');
            assert.equal(_options.method, 'GET');
            assert.equal(_reqEndCount, 1);
            assert.equal(_err.message, 'Unable to send request!');
        },
        'should call success callback when there is no error on udp send': function (topic) {
            var _socketType, _buffer, _offset, _length, _port, _host, _data, _socketOnErrorCount = 0, _socketCloseCount = 0,
                successCb = function (data) {
                    _data = data;
                },
                errorCb = function (err) {
                    assert.fail('Error callback should not have been called.');
                },
                socket = {
                    on: function (event, cb) {
                        if (event === 'error') {
                            _socketOnErrorCount += 1;
                        } else if (event === 'message') {
                            cb('<hudson><version>1.414</version><url>http://localhost:8081/</url><server-id>6ff95df5e7e248d51186e6d96085f42a</server-id><slave-port>50802</slave-port></hudson>');
                        }
                    },
                    send: function (buffer, offset, length, port, host, cb) {
                        _buffer = buffer;
                        _offset = offset;
                        _length = length;
                        _port = port;
                        _host = host;
                        cb(null, buffer);
                    },
                    close: function () {
                        _socketCloseCount += 1;
                    }
                },
                dgram = {
                    createSocket: function (socketType) {
                        _socketType = socketType;
                        return socket;
                    }
                },
                service = new Service('http://localhost:8080', null, dgram);
            service.sendUdp('Nestor reporting for duty', 'localhost', 88888, successCb, errorCb);
            assert.equal(_socketType, 'udp4');
            assert.equal(_buffer.toString(), 'Nestor reporting for duty');
            assert.equal(_offset, 0);
            assert.equal(_length, 25);
            assert.equal(_port, 88888);
            assert.equal(_host, 'localhost');
            assert.equal(_socketOnErrorCount, 1);
            assert.equal(_socketCloseCount, 1);
            assert.equal(_data['server-id'], '6ff95df5e7e248d51186e6d96085f42a');
            assert.equal(_data['slave-port'], '50802');
            assert.equal(_data.url, 'http://localhost:8081/');
            assert.equal(_data.version, '1.414');
        },
        'should call error callback when there is an error on udp send': function (topic) {
            var _socketType, _buffer, _offset, _length, _port, _host, _err, _socketCloseCount = 0,
                successCb = function (data) {
                    assert.fail('Success callback should not have been called.');
                },
                errorCb = function (err) {
                    _err = err;
                },
                socket = {
                    on: function (event, cb) {
                    },
                    send: function (buffer, offset, length, port, host, cb) {
                        _buffer = buffer;
                        _offset = offset;
                        _length = length;
                        _port = port;
                        _host = host;
                        cb(new Error('dummy error'));
                    },
                    close: function () {
                        _socketCloseCount += 1;
                    }
                },
                dgram = {
                    createSocket: function (socketType) {
                        _socketType = socketType;
                        return socket;
                    }
                },
                service = new Service('http://localhost:8080', null, dgram);
            service.sendUdp('Nestor reporting for duty', 'localhost', 88888, successCb, errorCb);
            assert.equal(_socketType, 'udp4');
            assert.equal(_buffer.toString(), 'Nestor reporting for duty');
            assert.equal(_offset, 0);
            assert.equal(_length, 25);
            assert.equal(_port, 88888);
            assert.equal(_host, 'localhost');
            assert.equal(_socketCloseCount, 1);
            assert.equal(_err.message, 'dummy error');
        },
        'should call error callback when there is an error during udp send': function (topic) {
            var _socketType, _buffer, _offset, _length, _port, _host, _err, _socketCloseCount = 0,
                successCb = function (data) {
                    assert.fail('Success callback should not have been called.');
                },
                errorCb = function (err) {
                    _err = err;
                },
                socket = {
                    on: function (event, cb) {
                        if (event === 'error') {
                            cb(new Error('dummy error'));
                        }
                    },
                    send: function (buffer, offset, length, port, host, cb) {
                        _buffer = buffer;
                        _offset = offset;
                        _length = length;
                        _port = port;
                        _host = host;
                    },
                    close: function () {
                        _socketCloseCount += 1;
                    }
                },
                dgram = {
                    createSocket: function (socketType) {
                        _socketType = socketType;
                        return socket;
                    }
                },
                service = new Service('http://localhost:8080', null, dgram);
            service.sendUdp('Nestor reporting for duty', 'localhost', 88888, successCb, errorCb);
            assert.equal(_socketType, 'udp4');
            assert.equal(_buffer.toString(), 'Nestor reporting for duty');
            assert.equal(_offset, 0);
            assert.equal(_length, 25);
            assert.equal(_port, 88888);
            assert.equal(_host, 'localhost');
            assert.equal(_socketCloseCount, 1);
            assert.equal(_err.message, 'dummy error');
        }
    }
}).export(module);