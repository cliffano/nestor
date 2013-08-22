var irc = require('irc'),
  text = require('bagoftext'),
  util = require('util');

function Bot(commands) {
  this.commands = commands || {};
}

Bot.prototype.connect = function (host, channel, opts) {
  const PENDING = 1000;

  this.nick = (opts && opts.nick) ? opts.nick : 'nestor';
  this.channel = '#' + channel;

  var self = this;

  process.on('SIGINT', function () { self.disconnect(); });
  process.on('SIGTERM', function () { self.disconnect(); });

  console.log(text.__('Connecting to %s as %s'), host, this.nick);
  this.client = new irc.Client(host, this.nick);

  this.client.addListener('error', function (err) {
    console.error(text.__('Error: '), err);
  });

  this.client.addListener('message' + this.channel, function (from, message) {
    if (message.match(new RegExp('^' + self.nick))) {
      var parts = message.split(' '),
        command = parts[1],
        args = parts.slice(2);

      if (command === undefined) {
        self.say(text.__('Usage: %s <command> <arg1> ... <argN>'), self.nick);
      } else if (self.commands[command]) {
        self.commands[command].apply(self, args);  
      } else {
        self.say(text.__('Command \'%s\' is not supported'), command);
      }
    }
  });

  console.log(text.__('Joining channel %s'), self.channel);
  setTimeout(function () {
    self.client.join(self.channel);
  }, (opts && opts.pending) ? opts.pending : PENDING);

};

Bot.prototype.disconnect = function () {
  if (!this.client) {
    console.error(text.__('Not connected yet, bot#connect must be called first'));
  } else {
    console.log(text.__('Leaving channel %s and disconnecting'), this.channel);
    this.client.part(this.channel);
    process.exit(0);
  }
};

Bot.prototype.say = function () {
  if (!this.client) {
    console.error(text.__('Not connected yet, bot#connect must be called first'));
  } else {
    var message = util.format.apply(this, arguments);
    this.client.say(this.channel, message);
  }
};

Bot.prototype.handleCb = function (successCb) {
  var self = this;
  return function (err, result) {
    if (err) {
      console.error(err.message);
      self.say(err.message);
    } else {
      successCb(result);
    }
  };
};

module.exports = Bot;
