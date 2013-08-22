var buster = require('buster'),
  NinjaBlocks = require('../../lib/notifiers/ninjablocks'),
  ninjaBlocks = require('ninja-blocks'),
  text = require('bagoftext');

text.setLocale('en');

buster.testCase('ninjablocks - ninjablocks', {
  'should set token via constructor': function () {
    var ninja = new NinjaBlocks('sometoken');
    assert.equals(ninja.token, 'sometoken');
  }
});

buster.testCase('ninjablocks - notify', {
  setUp: function () {
    this.mockConsole = this.mock(console);
    this.mockNinjaBlocks = this.mock(ninjaBlocks);
    this.ninja = new NinjaBlocks('sometoken');
  },
  'should log warning message when there is no rgbled device found': function () {
    this.mockConsole.expects('warn').once().withExactArgs('No rgbled device found');
    var mockApp = {
      devices: function (opts, cb) {
        assert.equals(opts.device_type, 'rgbled');
        assert.equals(opts.default_name, 'Nina\'s Eyes');
        cb(null, {});
      }
    };
    this.mockNinjaBlocks.expects('app').once().withExactArgs({ user_access_token: 'sometoken' }).returns(mockApp);
    this.ninja.notify('OK');
  },
  'should log error message when an error occurs while getting a device': function () {
    this.mockConsole.expects('error').once().withExactArgs('some error');
    var mockApp = {
      devices: function (opts, cb) {
        assert.equals(opts.device_type, 'rgbled');
        assert.equals(opts.default_name, 'Nina\'s Eyes');
        cb(new Error('some error'));
      }
    };
    this.mockNinjaBlocks.expects('app').once().withExactArgs({ user_access_token: 'sometoken' }).returns(mockApp);
    this.ninja.notify('OK');
  },
  'should actuate colour on ninjablocks device based on notification status': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Setting rgbled device colour to %s for status %s', '00FF00', 'OK');
    var mockApp = {
      devices: function (opts, cb) {
        assert.equals(opts.device_type, 'rgbled');
        assert.equals(opts.default_name, 'Nina\'s Eyes');
        cb(null, { guid1: {} });
      },
      device: function (key) {
        assert.equals(key, 'guid1');
        return {
          actuate: function (colour) {
            assert.equals(colour, '00FF00');
            done();
          }
        };
      }
    };
    this.mockNinjaBlocks.expects('app').once().withExactArgs({ user_access_token: 'sometoken' }).returns(mockApp);
    this.ninja.notify('OK');
  },
  'should actuate unknown colour on ninjablocks device when notification status is unsupported': function (done) {
    this.mockConsole.expects('log').once().withExactArgs('Setting rgbled device colour to %s for status %s', 'FFFFFF', 'SOMEUNKNOWNSTATUS');
    var mockApp = {
      devices: function (opts, cb) {
        assert.equals(opts.device_type, 'rgbled');
        assert.equals(opts.default_name, 'Nina\'s Eyes');
        cb(null, { guid1: {} });
      },
      device: function (key) {
        assert.equals(key, 'guid1');
        return {
          actuate: function (colour) {
            assert.equals(colour, 'FFFFFF');
            done();
          }
        };
      }
    };
    this.mockNinjaBlocks.expects('app').once().withExactArgs({ user_access_token: 'sometoken' }).returns(mockApp);
    this.ninja.notify('SOMEUNKNOWNSTATUS');
  }
});