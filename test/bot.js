var Bot = require('../lib/bot'),
  buster = require('buster-node'),
  irc = require('irc'),
  referee = require('referee'),
  text = require('bagoftext'),
  assert = referee.assert;

text.setLocale('en');

buster.testCase('bot - connect', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockIrc = this.mock(irc);
    this.mockProcess = this.mock(process);
    this.bot = new Bot();
  },
  'should join a channel': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor').returns({
      addListener: function (event, cb) {},
      join: function (channel) {
        assert.equals(channel, '#somechannel');
        done();
      }
    });
    this.bot.connect('somehost', 'somechannel', { pending: 1});
  },
  'should log an error when error event is emitted': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.mockConsole.expects('error').once().withExactArgs('Error: ', new Error('some message'));
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor').returns({
      addListener: function (event, cb) {
        if (event === 'error') {
          cb(new Error('some message'));
          done();
        }
      },
      join: function (channel) {}
    });
    this.bot.connect('somehost', 'somechannel', { pending: 1});
  },
  'should say usage instruction when command is not specified': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor').returns({
      addListener: function (event, cb) {
        if (event === 'message#somechannel') {
          cb('fromwhoever', 'nestor');
        }
      },
      join: function (channel) {}
    });
    this.bot.say = function (message, nick) {
      assert.equals(message, 'Usage: %s <command> <arg1> ... <argN>');
      assert.equals(nick, 'nestor');
      done();
    };
    this.bot.connect('somehost', 'somechannel', { pending: 1});
  },
  'should call command when command is supported': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor2');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.bot = new Bot({ somecommand: function() {
      done();
    }});
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor2').returns({
      addListener: function (event, cb) {
        if (event === 'message#somechannel') {
          cb('fromwhoever', 'nestor2 somecommand');
        }
      },
      join: function (channel) {}
    });
    this.bot.connect('somehost', 'somechannel', { nick: 'nestor2', pending: 1});
  },
  'should say command is not supported when command is unsupported': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor').returns({
      addListener: function (event, cb) {
        if (event === 'message#somechannel') {
          cb('fromwhoever', 'nestor sing');
        }
      },
      join: function (channel) {}
    });
    this.bot.say = function (message, command) {
      assert.equals(message, 'Command \'%s\' is not supported');
      assert.equals(command, 'sing');
      done();
    };
    this.bot.connect('somehost', 'somechannel', { pending: 1});
  },
  'should ignore message not directed to nick': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor').returns({
      addListener: function (event, cb) {
        if (event === 'message#somechannel') {
          cb('fromwhoever', 'bob what is up yo');
          done();
        }
      },
      join: function (channel) {}
    });
    this.bot.connect('somehost', 'somechannel', { pending: 1});
  },
  'should disconnect when SIGINT is sent': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.stub(process, 'on', function (event, cb) {
      if (event === 'SIGINT') {
        cb();
      }
    });
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor').returns({
      addListener: function (event, cb) {},
      join: function (channel) {}
    });
    this.bot.disconnect = function () {
      done();
    };
    this.bot.connect('somehost', 'somechannel', { pending: 1});
  },
  'should disconnect when SIGTERM is sent': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Connecting to %s as %s', 'somehost', 'nestor');
    this.mockConsole.expects('log').once().withExactArgs('Joining channel %s', '#somechannel');
    this.stub(process, 'on', function (event, cb) {
      if (event === 'SIGTERM') {
        cb();
      }
    });
    this.mockIrc.expects('Client').once().withExactArgs('somehost', 'nestor').returns({
      addListener: function (event, cb) {},
      join: function (channel) {}
    });
    this.bot.disconnect = function () {
      done();
    };
    this.bot.connect('somehost', 'somechannel', { pending: 1});
  }
});

buster.testCase('bot - disconnect', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockProcess = this.mock(process);
    this.bot = new Bot();
  },
  'should log error message when bot is not yet connected': function () {
    this.mockConsole.expects('error').once().withExactArgs('Not connected yet, bot#connect must be called first');
    this.bot.disconnect();
  },
  'should log leaving channel message then exit when bot is connected': function (done) {
    this.bot.channel = '#somechannel';
    this.mockConsole.expects('log').once().withExactArgs('Leaving channel %s and disconnecting', '#somechannel');    
    this.mockProcess.expects('exit').once().withExactArgs(0);
    this.bot.client = {
      part: function (channel) {
        assert.equals(channel, '#somechannel');
        done();
      }
    };
    this.bot.disconnect();
  }
});

buster.testCase('bot - say', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.bot = new Bot();
  },
  'should log error message when bot is not yet connected': function () {
    this.mockConsole.expects('error').once().withExactArgs('Not connected yet, bot#connect must be called first');
    this.bot.say('Some message');
  },
  'should delegate call to irc client when it is available': function (done) {
    this.bot.client = {
      say: function (channel, message) {
        assert.equals(channel, '#somechannel');
        assert.equals(message, 'Some message 1 Some message 2');
        done();
      }
    };
    this.bot.channel = '#somechannel';
    this.bot.say('Some message 1', 'Some message 2');
  }
});

buster.testCase('bot - handleCb', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.bot = new Bot();
  },
  'should log and say error message when an error occurs': function (done) {
    this.mockConsole.expects('error').once().withExactArgs('some message');
    this.bot.say = function (message) {
      assert.equals(message, 'some message');
      done();
    };
    this.bot.handleCb()(new Error('some message'));
  },
  'should pass result to success callback when there is no error': function (done) {
    function successCb(result) {
      assert.equals(result, 'some result');
      done();
    }
    this.bot.handleCb(successCb)(null, 'some result');
  }
});
