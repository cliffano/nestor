var bag = require('bagofholding'),
  buster = require('buster'),
  irc = require('../lib/irc'),
  Jenkins = new require('../lib/jenkins');

buster.testCase('irc - build', {
  'should say job started successfully when build is called  and job exists': function (done) {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.build('job1', 'foo=bar&foo1=bar1');
    });
    this.stub(Jenkins.prototype, 'build', function (jobName, params, cb) {
      assert.equals(jobName, 'job1');
      assert.equals(params, 'foo=bar&foo1=bar1');
      cb();
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data) {
      assert.equals(format, 'Job %s was started successfully');
      assert.equals(data, 'job1');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  },
  'should say job started successfully when build is called  without params': function (done) {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.build('job1');
    });
    this.stub(Jenkins.prototype, 'build', function (jobName, params, cb) {
      assert.equals(jobName, 'job1');
      assert.equals(params, undefined);
      cb();
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data) {
      assert.equals(format, 'Job %s was started successfully');
      assert.equals(data, 'job1');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});

buster.testCase('irc - stop', {
  'setUp': function () {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.stop('job1');
    });
  },
  'should say job started successfully when stop is called  and job exists': function (done) {
    this.stub(Jenkins.prototype, 'stop', function (jobName, cb) {
      assert.equals(jobName, 'job1');
      cb(null, 'job1');
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data) {
      assert.equals(format, 'Job %s was stopped successfully');
      assert.equals(data, 'job1');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});

buster.testCase('irc - dashboard', {
  'setUp': function () {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.dashboard();
    });
  },
  'should say jobs status and name when dashboard is called and Jenkins result has jobs': function (done) {
    var result = [];
    this.stub(Jenkins.prototype, 'dashboard', function (cb) {
      cb(null, [
        { status: 'OK', name: 'job1' },
        { status: 'FAIL', name: 'job2' }
      ]);
    });
    this.stub(bag.irc.Bot.prototype, 'say', function () {
      result.push(arguments);
      if (result.length === 2) {
        assert.equals(result[0][0], '%s - %s');
        assert.equals(result[0][1], 'OK');
        assert.equals(result[0][2], 'job1');
        assert.equals(result[1][0], '%s - %s');
        assert.equals(result[1][1], 'FAIL');
        assert.equals(result[1][2], 'job2');
        done();
      }
    });
    irc.start('somehost', 'somechannel', 'somenick');
  },
  'should say no job when dashboard is called and Jenkins result has no job': function (done) {
    this.stub(Jenkins.prototype, 'dashboard', function (cb) {
      cb(null, []);
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data) {
      assert.equals(format, 'Jobless Jenkins');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});

buster.testCase('irc - discover', {
  'should say version and url when discover is called and there is a running Jenkins instance': function (done) {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.discover('localhost');
    });
    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data0, data1) {
      assert.equals(format, 'Jenkins ver. %s is running on %s');
      assert.equals(data0, '1.2.3');
      assert.equals(data1, 'http://localhost:8080/');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  },
  'should use localhost when discover is called without host arg': function (done) {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.discover();
    });
    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data0, data1) {
      assert.equals(format, 'Jenkins ver. %s is running on %s');
      assert.equals(data0, '1.2.3');
      assert.equals(data1, 'http://localhost:8080/');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  },
  'should say host instead of url when discover result does not include any url': function (done) {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.discover('localhost');
    });
    this.stub(Jenkins.prototype, 'discover', function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data0, data1) {
      assert.equals(format, 'Jenkins ver. %s is running on %s');
      assert.equals(data0, '1.2.3');
      assert.equals(data1, 'localhost');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});

buster.testCase('irc - executor', {
  'setUp': function () {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.executor();
    });
  },
  'should say executor status when executor is called and there are some executors': function (done) {
    var result = [];
    this.stub(Jenkins.prototype, 'executor', function (cb) {
      cb(null, {
        master: [
          { idle: true },
          { idle: false, name: 'job1', progress: 5 },
          { idle: false, progress: 33 }
        ],
        slave: [
          { idle: false, stuck: true, name: 'job2' , progress: 11 }
        ]
      });
    });
    this.stub(bag.irc.Bot.prototype, 'say', function () {
      result.push(arguments);
      if (result.length === 6) {
        assert.equals(result[0][0], '+ master');
        assert.equals(result[1][0], '  - idle');
        assert.equals(result[2][0], '  - %s | %s%%s');
        assert.equals(result[2][1], 'job1');
        assert.equals(result[2][2], 5); 
        assert.equals(result[2][3], '');
        assert.equals(result[3][0], '  - %s | %s%%s');
        assert.equals(result[3][1], undefined);
        assert.equals(result[3][2], 33); 
        assert.equals(result[3][3], '');
        assert.equals(result[4][0], '+ slave');
        assert.equals(result[5][0], '  - %s | %s%%s');
        assert.equals(result[5][1], 'job2');
        assert.equals(result[5][2], 11); 
        assert.equals(result[5][3], ' stuck!');
        done();
      }
    });
    irc.start('somehost', 'somechannel', 'somenick');
  },
  'should say no executor found when executor is called and there is no executor': function (done) {
    this.stub(Jenkins.prototype, 'executor', function (cb) {
      cb(null, {});
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data) {
      assert.equals(format, 'No executor found');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});

buster.testCase('irc - job', {
  'setUp': function () {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.job('job1');
    });
  },
  'should say job name, status, and reports when job exists': function (done) {
    var result = [];
    this.stub(Jenkins.prototype, 'job', function (name, cb) {
      assert.equals(name, 'job1');
      cb(null, {
        status: 'OK',
        reports: ['Coverage 100%', 'All good!']
      });
    });
    this.stub(bag.irc.Bot.prototype, 'say', function () {
      result.push(arguments);
      if (result.length === 3) {
        assert.equals(result[0][0], '%s | %s');
        assert.equals(result[0][1], 'job1');
        assert.equals(result[0][2], 'OK');
        assert.equals(result[1][0], ' - %s');
        assert.equals(result[1][1], 'Coverage 100%');
        assert.equals(result[2][0], ' - %s');
        assert.equals(result[2][1], 'All good!');
        done();
      }
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});

buster.testCase('irc - queue', {
  'setUp': function () {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.queue();
    });
  },
  'should say queued job names when queue is called and there are some queued jobs': function (done) {
    var result = [];
    this.stub(Jenkins.prototype, 'queue', function (cb) {
      cb(null, ['job1', 'job2']);
    });
    this.stub(bag.irc.Bot.prototype, 'say', function () {
      result.push(arguments);
      if (result.length === 2) {
        assert.equals(result[0][0], '- %s');
        assert.equals(result[0][1], 'job1');
        assert.equals(result[1][0], '- %s');
        assert.equals(result[1][1], 'job2');
        done();
      }
    });
    irc.start('somehost', 'somechannel', 'somenick');
  },
  'should say queue empty message when queue is called and there is no queued job': function (done) {
    this.stub(Jenkins.prototype, 'queue', function (cb) {
      cb(null, []);
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data) {
      assert.equals(format, 'Queue is empty');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});

buster.testCase('irc - ver', {
  'setUp': function () {
    this.stub(bag.irc.Bot.prototype, 'start', function (commands) {
      commands.ver();
    });
  },
  'should say version when ver is called and version exists': function (done) {
    this.stub(Jenkins.prototype, 'version', function (cb) {
      cb(null, '1.2.3');
    });
    this.stub(bag.irc.Bot.prototype, 'say', function (format, data) {
      assert.equals(format, 'Jenkins ver. %s');
      assert.equals(data, '1.2.3');
      done();
    });
    irc.start('somehost', 'somechannel', 'somenick');
  }
});