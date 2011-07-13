var assert = require('assert'),
    Nestor = require('../../lib/nestor').Nestor,
    vows = require('vows');

vows.describe('Nestor').addBatch({
    'queue': {
        'should log item task name in the queue': function (topic) {
            var _path, _method,
                messages = [],
                console = {
                    log: function (message) {
                        messages.push(message);
                    }
                },
                service = {
                    send: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, null,
                            '{"items":[' +
                            '{"actions":[{"parameters":[{"name":"blah","value":"default-blah"},{"name":"bluh","value":"default-bluh"}]},{"causes":[{"shortDescription":"Started by user anonymous","userName":"anonymous"}]}],"blocked":true,"buildable":false,"params":"\\n(StringParameterValue) blah=\'default-blah\'\\n(StringParameterValue) bluh=\'default-bluh\'","stuck":false,"task":{"name":"blah-sleep1","url":"http://localhost:8080/job/blah-sleep1/","color":"blue_anime"},"why":"Build #20 is already in progress (ETA:40 sec)","buildableStartMilliseconds":1310478638367},' +
                            '{"actions":[{"parameters":[{"name":"blah","value":"default-blah"},{"name":"bluh","value":"default-bluh"}]},{"causes":[{"shortDescription":"Started by user anonymous","userName":"anonymous"}]}],"blocked":true,"buildable":false,"params":"\\n(StringParameterValue) blah=\'default-blah\'\\n(StringParameterValue) bluh=\'default-bluh\'","stuck":false,"task":{"name":"blah-sleep2","url":"http://localhost:8080/job/blah-sleep2/","color":"blue_anime"},"why":"Build #20 is already in progress (ETA:40 sec)","buildableStartMilliseconds":1310478638368}' +
                            ']}');
                    }
                },
                nestor = new Nestor(service, console);
            nestor.queue();
            assert.equal(_path, '/queue/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 2);
            assert.equal(messages[0], 'blah-sleep1');
            assert.equal(messages[1], 'blah-sleep2');
        },
        'should log empty queue message when there is nothing in the queue': function (topic) {
            var _path, _method,
                messages = [],
                console = {
                    log: function (message) {
                        messages.push(message);
                    }
                },
                service = {
                    send: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, null, '{"items":[]}');
                    }
                },
                nestor = new Nestor(service, console);
            nestor.queue();
            assert.equal(_path, '/queue/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'nestor: Queue is empty');
        },
        'should log error message when status code is not 200': function (topic) {
            var _path, _method,
                messages = [],
                console = {
                    error: function (message) {
                        messages.push(message);
                    }
                },
                service = {
                    send: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(500, null, '{"items":[]}');
                    }
                },
                nestor = new Nestor(service, console);
            nestor.queue();
            assert.equal(_path, '/queue/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'nestor: Unexpected status code 500');
        }
    },
    'version': {
        'should log header x-jenkins when it exists': function (topic) {
            var _path, _method,
                messages = [],
                console = {
                    log: function (message) {
                        messages.push(message);
                    }
                },
                headers = { 'x-jenkins': '0.88' },
                service = {
                    send: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, headers, null);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.version();
            assert.equal(_path, '/');
            assert.equal(_method, 'HEAD');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], '0.88');
        },
        'should log error message when header x-jenkins does not exist': function (topic) {
            var _path, _method,
                messages = [],
                console = {
                    error: function (message) {
                        messages.push(message);
                    }
                },
                headers = {},
                service = {
                    send: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, headers, null);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.version();
            assert.equal(_path, '/');
            assert.equal(_method, 'HEAD');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'nestor: Not a Jenkins server');
        },
        'should log error message when status code is not 200': function (topic) {
            var _path, _method,
                messages = [],
                console = {
                    error: function (message) {
                        messages.push(message);
                    }
                },
                headers = {},
                service = {
                    send: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(500, headers, null);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.version();
            assert.equal(_path, '/');
            assert.equal(_method, 'HEAD');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'nestor: Unexpected status code 500');
        }
    }
}).export(module);