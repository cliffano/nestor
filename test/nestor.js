var assert = require('assert'),
    Nestor = require('../lib/nestor').Nestor,
    vows = require('vows');

vows.describe('Nestor').addBatch({
    'dashboard': {
        'should return jobs status and name when there are jobs': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        var result = '{"assignedLabels":[{}],"mode":"NORMAL","nodeDescription":"the master Nestor node","nodeName":"","numExecutors":2,"description":null,' +
                            '"jobs":[{"name":"red-rackham","url":"http://localhost:8080/job/red-rackham/","color":"red"},' +
                            '{"name":"golden-claw","url":"http://localhost:8080/job/golden-claw/","color":"blue"}],' +
                            '"overallLoad":{},"primaryView":{"name":"All","url":"http://localhost:8080/"},"slaveAgentPort":0,"useCrumbs":false,"useSecurity":false,"views":[{"name":"All","url":"http://localhost:8080/"}]}';
                        successCb(200, null, result);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.dashboard(cb);
            assert.equal(_path, '/api/json');
            assert.equal(_method, 'GET');
            assert.isUndefined(_err);
            assert.equal(_result.length, 2);
            assert.equal(_result[0].status, 'FAIL');
            assert.equal(_result[0].name, 'red-rackham');
            assert.equal(_result[1].status, 'OK');
            assert.equal(_result[1].name, 'golden-claw');
        },
        'should return empty array when there is no job': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        var result = '{"assignedLabels":[{}],"mode":"NORMAL","nodeDescription":"the master Nestor node","nodeName":"","numExecutors":2,"description":null,' +
                            '"jobs":[],' +
                            '"overallLoad":{},"primaryView":{"name":"All","url":"http://localhost:8080/"},"slaveAgentPort":0,"useCrumbs":false,"useSecurity":false,"views":[{"name":"All","url":"http://localhost:8080/"}]}';
                        successCb(200, null, result);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.dashboard(cb);
            assert.equal(_path, '/api/json');
            assert.equal(_method, 'GET');
            assert.isUndefined(_err);
            assert.equal(_result.length, 0);
        }
    },
    'job': {
        'should display job info when job exists': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        var result = '{"actions":[{"parameterDefinitions":[{"defaultParameterValue":{"value":"default-blah"},"description":"","name":"BLAH","type":"StringParameterDefinition"},{"defaultParameterValue":{"value":"Cutts"},"description":"","name":"BLUH","type":"StringParameterDefinition"}]},{}],' +
                            '"description":"","displayName":"blah-sleep","name":"blah-sleep","url":"http://localhost:8080/job/blah-sleep/","buildable":true,"builds":[{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},{"number":41,"url":"http://localhost:8080/job/blah-sleep/41/"}],' +
                            '"color":"blue","firstBuild":{"number":1,"url":"http://localhost:8080/job/blah-sleep/1/"},"healthReport":[{"description":"Build stability: No recent builds failed.","iconUrl":"health-80plus.png","score":100}],"inQueue":false,"keepDependencies":false,' +
                            '"lastBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},"lastCompletedBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},"lastFailedBuild":null,"lastStableBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},' +
                            '"lastSuccessfulBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},"lastUnstableBuild":null,"lastUnsuccessfulBuild":{"number":18,"url":"http://localhost:8080/job/blah-sleep/18/"},"nextBuildNumber":43,' +
                            '"property":[{},{"parameterDefinitions":[{"defaultParameterValue":{"name":"BLAH","value":"default-blah"},"description":"","name":"BLAH","type":"StringParameterDefinition"},{"defaultParameterValue":{"name":"BLUH","value":"Cutts"},' +
                            '"description":"","name":"BLUH","type":"StringParameterDefinition"}]},{}],"queueItem":null,"concurrentBuild":false,"downstreamProjects":[],"scm":{},"upstreamProjects":[]}';
                        successCb(200, null, result);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.job('dummyjob', cb);
            assert.equal(_path, '/job/dummyjob/api/json');
            assert.equal(_method, 'GET');
            assert.isUndefined(_err);
            assert.equal(_result.status, 'OK');
            assert.equal(_result.reports.length, 1);
            assert.equal(_result.reports[0], 'Build stability: No recent builds failed.');
        },
        'should return job not found error if status code is 404': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(404, null, null);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.job('dummyjob', cb);
            assert.equal(_path, '/job/dummyjob/api/json');
            assert.equal(_method, 'GET');
            assert.equal(_err.message, 'Job does not exist');
            assert.isUndefined(_result);
        }
    },
    'build': {
        'should return ok status when there is no error': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, null, '');
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.build('dummyjob', 'firstname=Archibald&surname=Haddock', cb);
            assert.equal(_path, '/job/dummyjob/build?token=nestor&json={"parameter":[{"name":"firstname","value":"Archibald"},{"name":"surname","value":"Haddock"}]}');
            assert.equal(_method, 'POST');
            assert.isUndefined(_err);
            assert.equal(_result.status, 'ok');
        },
        'should return username password required error if status code is 401': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(401, null, '');
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.build('dummyjob', null, cb);
            assert.equal(_path, '/job/dummyjob/build?token=nestor&json={"parameter":[]}');
            assert.equal(_method, 'POST');
            assert.equal(_err.message, 'Username and password are required');
            assert.isUndefined(_result);
        },
        'should return job not found error if status code is 404': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(404, null, '');
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.build('dummyjob', undefined, cb);
            assert.equal(_path, '/job/dummyjob/build?token=nestor&json={"parameter":[]}');
            assert.equal(_method, 'POST');
            assert.equal(_err.message, 'Job does not exist');
            assert.isUndefined(_result);
        }
    },
    'queue': {
        'should return item task name in the queue': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, null,
                            '{"items":[' +
                            '{"actions":[{"parameters":[{"name":"blah","value":"default-blah"},{"name":"bluh","value":"default-bluh"}]},{"causes":[{"shortDescription":"Started by user anonymous","userName":"anonymous"}]}],"blocked":true,"buildable":false,"params":"\\n(StringParameterValue) blah=\'default-blah\'\\n(StringParameterValue) bluh=\'default-bluh\'","stuck":false,"task":{"name":"blah-sleep1","url":"http://localhost:8080/job/blah-sleep1/","color":"blue_anime"},"why":"Build #20 is already in progress (ETA:40 sec)","buildableStartMilliseconds":1310478638367},' +
                            '{"actions":[{"parameters":[{"name":"blah","value":"default-blah"},{"name":"bluh","value":"default-bluh"}]},{"causes":[{"shortDescription":"Started by user anonymous","userName":"anonymous"}]}],"blocked":true,"buildable":false,"params":"\\n(StringParameterValue) blah=\'default-blah\'\\n(StringParameterValue) bluh=\'default-bluh\'","stuck":false,"task":{"name":"blah-sleep2","url":"http://localhost:8080/job/blah-sleep2/","color":"blue_anime"},"why":"Build #20 is already in progress (ETA:40 sec)","buildableStartMilliseconds":1310478638368}' +
                            ']}');
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.queue(cb);
            assert.equal(_path, '/queue/api/json');
            assert.equal(_method, 'GET');
            assert.isUndefined(_err);
            assert.equal(_result.length, 2);
            assert.equal(_result[0], 'blah-sleep1');
            assert.equal(_result[1], 'blah-sleep2');
        },
        'should return no item when there is nothing in the queue': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, null, '{"items":[]}');
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.queue(cb);
            assert.equal(_path, '/queue/api/json');
            assert.equal(_method, 'GET');
            assert.equal(_result.length, 0);
        },
        'should log error message when status code is an error': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(400, null, '{"items":[]}');
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.queue(cb);
            assert.equal(_path, '/queue/api/json');
            assert.equal(_method, 'GET');
            assert.equal(_err.message, 'Unexpected status code 400');
            assert.isUndefined(_result);
        }
    },
    'executor': {
        'should return progress and job name when it is not idle': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        var result = '{"busyExecutors":2,"computer":[{"actions":[],"displayName":"master",' +
                            '"executors":[{"currentExecutable":{"number":39,"url":"http://localhost:8080/job/red-rackham/39/"},"currentWorkUnit":{},"idle":false,"likelyStuck":false,"number":0,"progress":31},{"currentExecutable":{"number":12,"url":"http://localhost:8080/job/golden-claw/12/"},' +
                            '"currentWorkUnit":{},"idle":false,"likelyStuck":false,"number":1,"progress":28}],"icon":"computer.png","idle":false,"jnlpAgent":false,"launchSupported":true,"loadStatistics":{"busyExecutors":{},"queueLength":{},"totalExecutors":{}},"manualLaunchAllowed":true,' +
                            '"monitorData":{"hudson.node_monitors.SwapSpaceMonitor":{"availablePhysicalMemory":169869312,"availableSwapSpace":124780544,"totalPhysicalMemory":2146435072,"totalSwapSpace":133726208},"hudson.node_monitors.ArchitectureMonitor":"Mac OS X (x86_64)",' +
                            '"hudson.node_monitors.TemporarySpaceMonitor":{"size":98938888192},"hudson.node_monitors.ResponseTimeMonitor":{"average":145},"hudson.node_monitors.DiskSpaceMonitor":{"size":98938888192},"hudson.node_monitors.ClockMonitor":{"diff":0}},"numExecutors":2,' +
                            '"offline":false,"offlineCause":null,"oneOffExecutors":[],"temporarilyOffline":false}],"displayName":"nodes","totalExecutors":2}';
                        successCb(200, null, result);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.executor(cb);
            assert.equal(_path, '/computer/api/json?depth=1');
            assert.equal(_method, 'GET');
            assert.isUndefined(_err);
            assert.equal(_result.master.length, 2);
            assert.isFalse(_result.master[0].idle);
            assert.equal(_result.master[0].progress, '31');
            assert.equal(_result.master[0].name, 'red-rackham');
            assert.isFalse(_result.master[1].idle);
            assert.equal(_result.master[1].progress, '28');
            assert.equal(_result.master[1].name, 'golden-claw');
        },
        'should return idle true when job is idle': function (topic) {
            var _path, _method, _err, _result,
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        var result = '{"busyExecutors":0,"computer":[{"actions":[],"displayName":"master",' +
                            '"executors":[{"currentExecutable":null,"currentWorkUnit":null,"idle":true,"likelyStuck":false,"number":0,"progress":-1},{"currentExecutable":null,"currentWorkUnit":null,"idle":true,"likelyStuck":false,"number":1,"progress":-1}],' +
                            '"icon":"computer.png","idle":true,"jnlpAgent":false,"launchSupported":true,"loadStatistics":{"busyExecutors":{},"queueLength":{},"totalExecutors":{}},"manualLaunchAllowed":true,' +
                            '"monitorData":{"hudson.node_monitors.SwapSpaceMonitor":{"availablePhysicalMemory":83886080,"availableSwapSpace":239075328,"totalPhysicalMemory":2146435072,"totalSwapSpace":268435456},"hudson.node_monitors.ArchitectureMonitor":"Mac OS X (x86_64)",' +
                            '"hudson.node_monitors.TemporarySpaceMonitor":{"size":98799357952},"hudson.node_monitors.ResponseTimeMonitor":{"average":72},"hudson.node_monitors.DiskSpaceMonitor":{"size":98799357952},"hudson.node_monitors.ClockMonitor":{"diff":0}},"numExecutors":2,' +
                            '"offline":false,"offlineCause":null,"oneOffExecutors":[],"temporarilyOffline":false}],"displayName":"nodes","totalExecutors":2}';
                        successCb(200, null, result);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.executor(cb);
            assert.equal(_path, '/computer/api/json?depth=1');
            assert.equal(_method, 'GET');
            assert.isUndefined(_err);
            assert.equal(_result.master.length, 2);
            assert.isTrue(_result.master[0].idle);
            assert.isTrue(_result.master[1].idle);
        }
    },
    'discover': {
        'should return json data when there is a discoverable jenkins instance': function (topic) {
            var _err, _result, _message, _host, _port,
                service = {
                    sendUdp: function (message, host, port, successCb, errorCb) {
                        _message = message;
                        _host = host;
                        _port = port;
                        successCb({
                            'server-id': '6ff95df5e7e248d51186e6d96085f42a',
                            'slave-port': '50802',
                            url: 'http://localhost:8080/',
                            version: '1.414'
                        });
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                }
                nestor = new Nestor(service);
            nestor.discover('somehost', cb);
            assert.equal(_message, 'Long live Jenkins');
            assert.equal(_host, 'somehost');
            assert.equal(_port, 33848);
            assert.isNull(_err);
            assert.equal(_result['server-id'], '6ff95df5e7e248d51186e6d96085f42a');
            assert.equal(_result['slave-port'], '50802');
            assert.equal(_result.url, 'http://localhost:8080/');
            assert.equal(_result.version, '1.414');
        },
        'should return error when an error occurs': function (topic) {
            var _err, _result, _message, _host, _port,
                service = {
                    sendUdp: function (message, host, port, successCb, errorCb) {
                        _message = message;
                        _host = host;
                        _port = port;
                        errorCb(new Error('dummy error'));
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                }
                nestor = new Nestor(service);
            nestor.discover('somehost', cb);
            assert.equal(_message, 'Long live Jenkins');
            assert.equal(_host, 'somehost');
            assert.equal(_port, 33848);
            assert.isUndefined(_result);
            assert.equal(_err.message, 'dummy error');
        }
    },
    'version': {
        'should return header x-jenkins when it exists': function (topic) {
            var _path, _method, _err, _result,
                headers = { 'x-jenkins': '0.88' },
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, headers, null);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.version(cb);
            assert.equal(_path, '/');
            assert.equal(_method, 'HEAD');
            assert.isUndefined(_err);
            assert.equal(_result, '0.88');
        },
        'should return error when header x-jenkins does not exist': function (topic) {
            var _path, _method, _err, _result,
                headers = {},
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(200, headers, null);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.version(cb);
            assert.equal(_path, '/');
            assert.equal(_method, 'HEAD');
            assert.equal(_err.message, 'Not a Jenkins server');
            assert.isUndefined(_result);
        },
        'should log error message when status code is an error': function (topic) {
            var _path, _method, _err, _result,
                headers = {},
                service = {
                    sendHttp: function (path, method, successCb, errorCb) {
                        _path = path;
                        _method = method;
                        successCb(500, headers, null);
                    }
                },
                cb = function (err, result) {
                    _err = err;
                    _result = result;
                },
                nestor = new Nestor(service);
            nestor.version(cb);
            assert.equal(_path, '/');
            assert.equal(_method, 'HEAD');
            assert.equal(_err.message, 'Unexpected status code 500');
            assert.isUndefined(_result);
        }
    }
}).export(module);