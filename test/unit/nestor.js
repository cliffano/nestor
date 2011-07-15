var assert = require('assert'),
    Nestor = require('../../lib/nestor').Nestor,
    vows = require('vows');

vows.describe('Nestor').addBatch({
    'dashboard': {
        'should log jobs status when there are jobs': function (topic) {
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
                        var result = '{"assignedLabels":[{}],"mode":"NORMAL","nodeDescription":"the master Jenkins node","nodeName":"","numExecutors":2,"description":null,' +
                            '"jobs":[{"name":"red-rackham","url":"http://localhost:8080/job/red-rackham/","color":"red"},' +
                            '{"name":"golden-claw","url":"http://localhost:8080/job/golden-claw/","color":"blue"}],' +
                            '"overallLoad":{},"primaryView":{"name":"All","url":"http://localhost:8080/"},"slaveAgentPort":0,"useCrumbs":false,"useSecurity":false,"views":[{"name":"All","url":"http://localhost:8080/"}]}';
                        successCb(200, null, result);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.dashboard();
            assert.equal(_path, '/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 2);
            assert.equal(messages[0], 'FAIL\tred-rackham');
            assert.equal(messages[1], 'OK\tgolden-claw');
        },
        'should log no job message when there is no job': function (topic) {
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
                        var result = '{"assignedLabels":[{}],"mode":"NORMAL","nodeDescription":"the master Jenkins node","nodeName":"","numExecutors":2,"description":null,' +
                            '"jobs":[],' +
                            '"overallLoad":{},"primaryView":{"name":"All","url":"http://localhost:8080/"},"slaveAgentPort":0,"useCrumbs":false,"useSecurity":false,"views":[{"name":"All","url":"http://localhost:8080/"}]}';
                        successCb(200, null, result);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.dashboard();
            assert.equal(_path, '/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'Jobless Jenkins');
        }
    },
    'job': {
        'should display job info when job exists': function (topic) {
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
                nestor = new Nestor(service, console);
            nestor.job('dummyjob');
            assert.equal(_path, '/job/dummyjob/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 2);
            assert.equal(messages[0], 'Status: OK');
            assert.equal(messages[1], 'Build stability: No recent builds failed.');
        },
        'should log job not found error if status code is 404': function (topic) {
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
                        successCb(404, null, null);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.job('dummyjob');
            assert.equal(_path, '/job/dummyjob/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'Job does not exist');
        }
    },
    'build': {
        'should log success message if status is ok': function (topic) {
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
                        successCb(200, null, '');
                    }
                },
                nestor = new Nestor(service, console);
            nestor.build('dummyjob', 'firstname=Archibald&surname=Haddock');
            assert.equal(_path, '/job/dummyjob/build?token=nestor&json={"parameter":[{"name":"firstname","value":"Archibald"},{"name":"surname","value":"Haddock"}]}');
            assert.equal(_method, 'POST');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'Job was started successfully');
        },
        'should log username password required error if status code is 401': function (topic) {
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
                        successCb(401, null, '');
                    }
                },
                nestor = new Nestor(service, console);
            nestor.build('dummyjob');
            assert.equal(_path, '/job/dummyjob/build?token=nestor&json={"parameter":[]}');
            assert.equal(_method, 'POST');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'Username and password are required');
        },
        'should log job not found error if status code is 404': function (topic) {
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
                        successCb(404, null, '');
                    }
                },
                nestor = new Nestor(service, console);
            nestor.build('dummyjob');
            assert.equal(_path, '/job/dummyjob/build?token=nestor&json={"parameter":[]}');
            assert.equal(_method, 'POST');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'Job does not exist');
        }
    },
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
            assert.equal(messages[0], 'Queue is empty');
        },
        'should log error message when status code is an error': function (topic) {
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
                        successCb(400, null, '{"items":[]}');
                    }
                },
                nestor = new Nestor(service, console);
            nestor.queue();
            assert.equal(_path, '/queue/api/json');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 1);
            assert.equal(messages[0], 'Unexpected status code 400');
        }
    },
    'executor': {
        'should log progress and job name when it is not idle': function (topic) {
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
                        var result = '{"busyExecutors":2,"computer":[{"actions":[],"displayName":"master",' +
                            '"executors":[{"currentExecutable":{"number":39,"url":"http://localhost:8080/job/red-rackham/39/"},"currentWorkUnit":{},"idle":false,"likelyStuck":false,"number":0,"progress":31},{"currentExecutable":{"number":12,"url":"http://localhost:8080/job/golden-claw/12/"},' +
                            '"currentWorkUnit":{},"idle":false,"likelyStuck":false,"number":1,"progress":28}],"icon":"computer.png","idle":false,"jnlpAgent":false,"launchSupported":true,"loadStatistics":{"busyExecutors":{},"queueLength":{},"totalExecutors":{}},"manualLaunchAllowed":true,' +
                            '"monitorData":{"hudson.node_monitors.SwapSpaceMonitor":{"availablePhysicalMemory":169869312,"availableSwapSpace":124780544,"totalPhysicalMemory":2146435072,"totalSwapSpace":133726208},"hudson.node_monitors.ArchitectureMonitor":"Mac OS X (x86_64)",' +
                            '"hudson.node_monitors.TemporarySpaceMonitor":{"size":98938888192},"hudson.node_monitors.ResponseTimeMonitor":{"average":145},"hudson.node_monitors.DiskSpaceMonitor":{"size":98938888192},"hudson.node_monitors.ClockMonitor":{"diff":0}},"numExecutors":2,' +
                            '"offline":false,"offlineCause":null,"oneOffExecutors":[],"temporarilyOffline":false}],"displayName":"nodes","totalExecutors":2}';
                        successCb(200, null, result);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.executor();
            assert.equal(_path, '/computer/api/json?depth=1');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 3);
            assert.equal(messages[0], '* master');
            assert.equal(messages[1], '31%\tred-rackham');
            assert.equal(messages[2], '28%\tgolden-claw');
        },
        'should log idle when job is not idle': function (topic) {
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
                        var result = '{"busyExecutors":0,"computer":[{"actions":[],"displayName":"master",' +
                            '"executors":[{"currentExecutable":null,"currentWorkUnit":null,"idle":true,"likelyStuck":false,"number":0,"progress":-1},{"currentExecutable":null,"currentWorkUnit":null,"idle":true,"likelyStuck":false,"number":1,"progress":-1}],' +
                            '"icon":"computer.png","idle":true,"jnlpAgent":false,"launchSupported":true,"loadStatistics":{"busyExecutors":{},"queueLength":{},"totalExecutors":{}},"manualLaunchAllowed":true,' +
                            '"monitorData":{"hudson.node_monitors.SwapSpaceMonitor":{"availablePhysicalMemory":83886080,"availableSwapSpace":239075328,"totalPhysicalMemory":2146435072,"totalSwapSpace":268435456},"hudson.node_monitors.ArchitectureMonitor":"Mac OS X (x86_64)",' +
                            '"hudson.node_monitors.TemporarySpaceMonitor":{"size":98799357952},"hudson.node_monitors.ResponseTimeMonitor":{"average":72},"hudson.node_monitors.DiskSpaceMonitor":{"size":98799357952},"hudson.node_monitors.ClockMonitor":{"diff":0}},"numExecutors":2,' +
                            '"offline":false,"offlineCause":null,"oneOffExecutors":[],"temporarilyOffline":false}],"displayName":"nodes","totalExecutors":2}';
                        successCb(200, null, result);
                    }
                },
                nestor = new Nestor(service, console);
            nestor.executor();
            assert.equal(_path, '/computer/api/json?depth=1');
            assert.equal(_method, 'GET');
            assert.equal(messages.length, 3);
            assert.equal(messages[0], '* master');
            assert.equal(messages[1], 'idle');
            assert.equal(messages[2], 'idle');
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
            assert.equal(messages[0], 'Not a Jenkins server');
        },
        'should log error message when status code is an error': function (topic) {
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
            assert.equal(messages[0], 'Unexpected status code 500');
        }
    }
}).export(module);