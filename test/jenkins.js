var assert = require('assert'),
  sandbox = require('sandboxed-module'),
  url = require('url'),
  vows = require('vows');

vows.describe('jenkins').addBatch({
  'comm': {
    topic: function () {
      return function (mockErr, mockResult, checks) {
        return new (sandbox.require('../lib/jenkins', {
          requires: {
            './comm': {
              http: function (path, method, url, cb) {
                assert.equal(path, checks.path);
                assert.equal(method, checks.method);
                assert.equal(url.href, checks.url);
                cb(mockErr, mockResult);
              },
              udp: function (message, host, port, cb) {
                assert.equal(message, checks.message);
                assert.equal(host, checks.host);
                assert.equal(port, checks.port);
                cb(mockErr, mockResult);
              }
            }
          }
        })).Jenkins(url.parse('http://user:pass@localhost:8080'));
      };
    },
    'when an inexisting job is built': {
      topic: function (topic) {
        topic(null, { statusCode: 404, headers: {}, data: '' },
          { path: '/job/myjob/build?token=nestor&json={"parameter":[{"name":"myparam1","value":"myvalue1"},{"name":"myparam2","value":"myvalue2"}]}', method: 'POST', url: 'http://user:pass@localhost:8080/' }).
          build('myjob', 'myparam1=myvalue1&myparam2=myvalue2', this.callback);
      },
      'then an error should occur': function (err, result) {
        assert.equal(err.message, 'Job does not exist');
        assert.isUndefined(result);
      }
    },
    'when an authentication is required for build but not supplied': {
      topic: function (topic) {
        topic(null, { statusCode: 401, headers: {}, data: '' },
          { path: '/job/myjob/build?token=nestor&json={"parameter":[{"name":"myparam1","value":"myvalue1"},{"name":"myparam2","value":"myvalue2"}]}', method: 'POST', url: 'http://user:pass@localhost:8080/' }).
          build('myjob', 'myparam1=myvalue1&myparam2=myvalue2', this.callback);
      },
      'then an error should occur': function (err, result) {
        assert.equal(err.message, 'Username and password are required');
        assert.isUndefined(result);
      }
    },
    'when a build url is forbidden': {
      topic: function (topic) {
        topic(null, { statusCode: 403, headers: {}, data: '' },
          { path: '/job/myjob/build?token=nestor&json={"parameter":[{"name":"myparam1","value":"myvalue1"},{"name":"myparam2","value":"myvalue2"}]}', method: 'POST', url: 'http://user:pass@localhost:8080/' }).
          build('myjob', 'myparam1=myvalue1&myparam2=myvalue2', this.callback);
      },
      'then an error should occur': function (err, result) {
        assert.equal(err.message, 'Username and password are required');
        assert.isUndefined(result);
      }
    },
    'when an existing job is built': {
      topic: function (topic) {
        topic(null, { statusCode: 200, headers: {}, data: '' },
          { path: '/job/myjob/build?token=nestor&json={"parameter":[{"name":"myparam1","value":"myvalue1"},{"name":"myparam2","value":"myvalue2"}]}', method: 'POST', url: 'http://user:pass@localhost:8080/' }).
          build('myjob', 'myparam1=myvalue1&myparam2=myvalue2', this.callback);
      },
      'then result status should be ok': function (err, result) {
        assert.equal(result.status, 'ok');
        assert.isNull(err);
      }
    },
    'when jenkins has jobs': {
      topic: function (topic) {
        var data = '{"assignedLabels":[{}],"mode":"NORMAL","nodeDescription":"the master Nestor node","nodeName":"","numExecutors":2,"description":null,' +
          '"jobs":[{"name":"red-rackham","url":"http://localhost:8080/job/red-rackham/","color":"red"},' +
          '{"name":"golden-claw","url":"http://localhost:8080/job/golden-claw/","color":"blue"}],' +
          '"overallLoad":{},"primaryView":{"name":"All","url":"http://localhost:8080/"},"slaveAgentPort":0,"useCrumbs":false,"useSecurity":false,"views":[{"name":"All","url":"http://localhost:8080/"}]}';
        topic(null, { statusCode: 200, headers: {}, data: data },
          { path: '/api/json', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          dashboard(this.callback);
      },
      'then dashboard result should contain job details': function (err, result) {
        assert.equal(result.length, 2);
        assert.equal(result[0].status, 'FAIL');
        assert.equal(result[0].name, 'red-rackham');
        assert.equal(result[1].status, 'OK');
        assert.equal(result[1].name, 'golden-claw');
        assert.isNull(err);
      }
    },
    'when jenkins has no job': {
      topic: function (topic) {
        var data = '{"assignedLabels":[{}],"mode":"NORMAL","nodeDescription":"the master Nestor node","nodeName":"","numExecutors":2,"description":null,' +
          '"jobs":[],' +
          '"overallLoad":{},"primaryView":{"name":"All","url":"http://localhost:8080/"},"slaveAgentPort":0,"useCrumbs":false,"useSecurity":false,"views":[{"name":"All","url":"http://localhost:8080/"}]}';
        topic(null, { statusCode: 200, headers: {}, data: data },
          { path: '/api/json', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          dashboard(this.callback);
      },
      'then dashboard result should be empty': function (err, result) {
        assert.isEmpty(result);
        assert.isNull(err);
      }
    },
    'when there is a discoverable jenkins instance': {
      topic: function (topic) {
        topic(null, { 'server-id': '6ff95df5e7e248d51186e6d96085f42a', 'slave-port': '50802', url: 'http://localhost:8080/', version: '1.414' },
          { message: 'Long live Jenkins', host: 'localhost', port: 33848 }).
          discover('localhost', this.callback);
      },
      'then discover result should contain instance details': function (err, result) {
        assert.equal(result['server-id'], '6ff95df5e7e248d51186e6d96085f42a');
        assert.equal(result['slave-port'], '50802');
        assert.equal(result.url, 'http://localhost:8080/');
        assert.equal(result.version, '1.414');
        assert.isNull(err);
      }
    },
    'when there is an error while trying to discover jenkins instance': {
      topic: function (topic) {
        topic(new Error('some error'), null,
          { message: 'Long live Jenkins', host: 'localhost', port: 33848 }).
          discover('localhost', this.callback);
      },
      'then an error should be passed via callback': function (err, result) {
        assert.equal(err.message, 'some error');
        assert.isUndefined(result);
      }
    },
    'when jenkins has in-progress executors': {
      topic: function (topic) {
        var data = '{"busyExecutors":2,"computer":[{"actions":[],"displayName":"master",' +
          '"executors":[{"currentExecutable":{"number":39,"url":"http://localhost:8080/job/red-rackham/39/"},"currentWorkUnit":{},"idle":false,"likelyStuck":false,"number":0,"progress":31},{"currentExecutable":{"number":12,"url":"http://localhost:8080/job/golden-claw/12/"},' +
          '"currentWorkUnit":{},"idle":false,"likelyStuck":false,"number":1,"progress":28}],"icon":"computer.png","idle":false,"jnlpAgent":false,"launchSupported":true,"loadStatistics":{"busyExecutors":{},"queueLength":{},"totalExecutors":{}},"manualLaunchAllowed":true,' +
          '"monitorData":{"hudson.node_monitors.SwapSpaceMonitor":{"availablePhysicalMemory":169869312,"availableSwapSpace":124780544,"totalPhysicalMemory":2146435072,"totalSwapSpace":133726208},"hudson.node_monitors.ArchitectureMonitor":"Mac OS X (x86_64)",' +
          '"hudson.node_monitors.TemporarySpaceMonitor":{"size":98938888192},"hudson.node_monitors.ResponseTimeMonitor":{"average":145},"hudson.node_monitors.DiskSpaceMonitor":{"size":98938888192},"hudson.node_monitors.ClockMonitor":{"diff":0}},"numExecutors":2,' +
          '"offline":false,"offlineCause":null,"oneOffExecutors":[],"temporarilyOffline":false}],"displayName":"nodes","totalExecutors":2}';
        topic(null, { statusCode: 200, headers: {}, data: data },
          { path: '/computer/api/json?depth=1', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          executor(this.callback);
      },
      'then executor result should contain job progress details': function (err, result) {
        assert.equal(result.master.length, 2);
        assert.isFalse(result.master[0].idle);
        assert.equal(result.master[0].progress, '31');
        assert.equal(result.master[0].name, 'red-rackham');
        assert.isFalse(result.master[1].idle);
        assert.equal(result.master[1].progress, '28');
        assert.equal(result.master[1].name, 'golden-claw');
        assert.isNull(err);
      }
    },
    'when jenkins has idle executors': {
      topic: function (topic) {
        var data = '{"busyExecutors":0,"computer":[{"actions":[],"displayName":"master",' +
          '"executors":[{"currentExecutable":null,"currentWorkUnit":null,"idle":true,"likelyStuck":false,"number":0,"progress":-1},{"currentExecutable":null,"currentWorkUnit":null,"idle":true,"likelyStuck":false,"number":1,"progress":-1}],' +
          '"icon":"computer.png","idle":true,"jnlpAgent":false,"launchSupported":true,"loadStatistics":{"busyExecutors":{},"queueLength":{},"totalExecutors":{}},"manualLaunchAllowed":true,' +
          '"monitorData":{"hudson.node_monitors.SwapSpaceMonitor":{"availablePhysicalMemory":83886080,"availableSwapSpace":239075328,"totalPhysicalMemory":2146435072,"totalSwapSpace":268435456},"hudson.node_monitors.ArchitectureMonitor":"Mac OS X (x86_64)",' +
          '"hudson.node_monitors.TemporarySpaceMonitor":{"size":98799357952},"hudson.node_monitors.ResponseTimeMonitor":{"average":72},"hudson.node_monitors.DiskSpaceMonitor":{"size":98799357952},"hudson.node_monitors.ClockMonitor":{"diff":0}},"numExecutors":2,' +
          '"offline":false,"offlineCause":null,"oneOffExecutors":[],"temporarilyOffline":false}],"displayName":"nodes","totalExecutors":2}';
        topic(null, { statusCode: 200, headers: {}, data: data },
          { path: '/computer/api/json?depth=1', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          executor(this.callback);
      },
      'then executor result should contain idle status': function (err, result) {
        assert.equal(result.master.length, 2);
        assert.isTrue(result.master[0].idle);
        assert.isTrue(result.master[1].idle);
        assert.isNull(err);
      }
    },
    'when job exists': {
      topic: function (topic) {
        var data = '{"actions":[{"parameterDefinitions":[{"defaultParameterValue":{"value":"default-blah"},"description":"","name":"BLAH","type":"StringParameterDefinition"},{"defaultParameterValue":{"value":"Cutts"},"description":"","name":"BLUH","type":"StringParameterDefinition"}]},{}],' +
          '"description":"","displayName":"blah-sleep","name":"blah-sleep","url":"http://localhost:8080/job/blah-sleep/","buildable":true,"builds":[{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},{"number":41,"url":"http://localhost:8080/job/blah-sleep/41/"}],' +
          '"color":"blue","firstBuild":{"number":1,"url":"http://localhost:8080/job/blah-sleep/1/"},"healthReport":[{"description":"Build stability: No recent builds failed.","iconUrl":"health-80plus.png","score":100}],"inQueue":false,"keepDependencies":false,' +
          '"lastBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},"lastCompletedBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},"lastFailedBuild":null,"lastStableBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},' +
          '"lastSuccessfulBuild":{"number":42,"url":"http://localhost:8080/job/blah-sleep/42/"},"lastUnstableBuild":null,"lastUnsuccessfulBuild":{"number":18,"url":"http://localhost:8080/job/blah-sleep/18/"},"nextBuildNumber":43,' +
          '"property":[{},{"parameterDefinitions":[{"defaultParameterValue":{"name":"BLAH","value":"default-blah"},"description":"","name":"BLAH","type":"StringParameterDefinition"},{"defaultParameterValue":{"name":"BLUH","value":"Cutts"},' +
          '"description":"","name":"BLUH","type":"StringParameterDefinition"}]},{}],"queueItem":null,"concurrentBuild":false,"downstreamProjects":[],"scm":{},"upstreamProjects":[]}';
        topic(null, { statusCode: 200, headers: {}, data: data },
          { path: '/job/dummyjob/api/json', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          job('dummyjob', this.callback);
      },
      'then job result should contain details': function (err, result) {
        assert.equal(result.status, 'OK');
        assert.equal(result.reports.length, 1);
        assert.equal(result.reports[0], 'Build stability: No recent builds failed.');
        assert.isNull(err);
      }
    },
    'when job does not exist': {
      topic: function (topic) {
        topic(null, { statusCode: 404, headers: {}, data: '' },
          { path: '/job/dummyjob/api/json', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          job('dummyjob', this.callback);
      },
      'then an error should be passed via callback': function (err, result) {
        assert.equal(err.message, 'Job does not exist');
        assert.isUndefined(result);
      }
    },
    'when there are jobs in the queue': {
      topic: function (topic) {
        var data = '{"items":[' +
          '{"actions":[{"parameters":[{"name":"blah","value":"default-blah"},{"name":"bluh","value":"default-bluh"}]},{"causes":[{"shortDescription":"Started by user anonymous","userName":"anonymous"}]}],"blocked":true,"buildable":false,"params":"\\n(StringParameterValue) blah=\'default-blah\'\\n(StringParameterValue) bluh=\'default-bluh\'","stuck":false,"task":{"name":"blah-sleep1","url":"http://localhost:8080/job/blah-sleep1/","color":"blue_anime"},"why":"Build #20 is already in progress (ETA:40 sec)","buildableStartMilliseconds":1310478638367},' +
          '{"actions":[{"parameters":[{"name":"blah","value":"default-blah"},{"name":"bluh","value":"default-bluh"}]},{"causes":[{"shortDescription":"Started by user anonymous","userName":"anonymous"}]}],"blocked":true,"buildable":false,"params":"\\n(StringParameterValue) blah=\'default-blah\'\\n(StringParameterValue) bluh=\'default-bluh\'","stuck":false,"task":{"name":"blah-sleep2","url":"http://localhost:8080/job/blah-sleep2/","color":"blue_anime"},"why":"Build #20 is already in progress (ETA:40 sec)","buildableStartMilliseconds":1310478638368}' +
          ']}';
        topic(null, { statusCode: 200, headers: {}, data: data },
          { path: '/queue/api/json', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          queue(this.callback);
      },
      'then queue result should contain details': function (err, result) {
        assert.equal(result.length, 2);
        assert.equal(result[0], 'blah-sleep1');
        assert.equal(result[1], 'blah-sleep2');
        assert.isNull(err);
      }
    },
    'when queue is empty': {
      topic: function (topic) {
        topic(null, { statusCode: 200, headers: {}, data: '{"items":[]}' },
          { path: '/queue/api/json', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          queue(this.callback);
      },
      'then queue result should be empty': function (err, result) {
        assert.isEmpty(result);
        assert.isNull(err);
      }
    },
    'when unexpected status code is returned': {
      topic: function (topic) {
        topic(null, { statusCode: 400, headers: {}, data: '{"items":[]}' },
          { path: '/queue/api/json', method: 'GET', url: 'http://user:pass@localhost:8080/' }).
          queue(this.callback);
      },
      'then error should be passed via callback': function (err, result) {
        assert.equal(err.message, 'Unexpected status code 400');
        assert.isUndefined(result);
      }
    },
    'when x-jenkins header exists': {
      topic: function (topic) {
        topic(null, { statusCode: 200, headers: { 'x-jenkins': '0.88' }, data: '' },
          { path: '/', method: 'HEAD', url: 'http://user:pass@localhost:8080/' }).
          version(this.callback);
      },
      'then version should contain jenkins version value': function (err, result) {
        assert.equal(result, '0.88');
        assert.isNull(err);
      }
    },
    'when x-jenkins header does not exist': {
      topic: function (topic) {
        topic(null, { statusCode: 200, headers: {}, data: '' },
          { path: '/', method: 'HEAD', url: 'http://user:pass@localhost:8080/' }).
          version(this.callback);
      },
      'then version should pass error via callback': function (err, result) {
        assert.equal(err.message, 'Not a Jenkins server');
        assert.isUndefined(result);
      }
    },
    'when version responds with an unexpected code': {
      topic: function (topic) {
        topic(null, { statusCode: 500, headers: {}, data: '' },
          { path: '/', method: 'HEAD', url: 'http://user:pass@localhost:8080/' }).
          version(this.callback);
      },
      'then version should pass error via callback': function (err, result) {
        assert.equal(err.message, 'Unexpected status code 500');
        assert.isUndefined(result);
      }
    }
  }
}).exportTo(module);