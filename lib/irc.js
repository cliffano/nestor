var _ = require('underscore'),
  irc = require('irc'),
  Jenkins = require('./jenkins'),
  jenkins = new Jenkins(process.env.JENKINS_URL, process.env.http_proxy),
  util = require('util'),
  bot;

function _build(jobName, params, args) {
  if (!args) {
    args = params || {};
  }
  jenkins.build(jobName, (_.isString(params)) ? params : undefined, bot.handleCb(function (result) {
    bot.say('Job %s was started successfully', jobName);
  }));
}

function _stop(jobName) {
  jenkins.stop(jobName, bot.handleCb(function (result) {
    bot.say('Job %s was stopped successfully', jobName);
  })); 
}

function _dashboard() {
  jenkins.dashboard(bot.handleCb(function (result) {
    if (result.length === 0) {
      bot.say('Jobless Jenkins');
    } else {
      result.forEach(function (job) {
        bot.say('%s - %s', job.status, job.name);
      });
    }
  }));
}

function _discover(host) {
  host = (_.isString(host)) ? host : 'localhost';
  jenkins.discover(host, bot.handleCb(function (result) {
    bot.say('Jenkins ver. %s is running on %s',
        result.hudson.version[0],
        (result.hudson.url && result.hudson.url[0]) ? result.hudson.url[0] : host);
  }));
}

function _executor() {
  jenkins.executor(bot.handleCb(function (result) {
    if (!_.isEmpty(_.keys(result))) {
      _.keys(result).forEach(function (computer) {
        bot.say('+ ' + computer);
        result[computer].forEach(function (executor) {
          if (executor.idle) {
            bot.say('  - idle');
          } else {
            bot.say('  - %s | %s%%s', executor.name, executor.progress, (executor.stuck) ? ' stuck!' : '');
          }
        });
      });
    } else {
      bot.say('No executor found');
    }
  }));
}

function _job(name) {
  jenkins.job(name, bot.handleCb(function (result) {
    bot.say('%s | %s', name, result.status);
    result.reports.forEach(function (report) {
      bot.say(' - %s', report);
    });
  }));
}

function _queue() {
  jenkins.queue(bot.handleCb(function (result) {
    if (result.length === 0) {
      bot.say('Queue is empty');
    } else {
      result.forEach(function (job) {
        bot.say('- %s', job);
      });
    }
  }));
}

function _version() {
  jenkins.version(bot.handleCb(function (result) {
    bot.say('Jenkins ver. %s', result);
  }));
}

function Bot(host, channel, opts) {
  opts = opts || {};
  this.nick = opts.nick || 'nestor';
  this.client = new irc.Client(host, this.nick);
  this.channel = '#' + channel;
}

Bot.prototype.start = function (commands) {
  var self = this;

  process.on('SIGINT', function () { self.stop(); });
  process.on('SIGTERM', function () { self.stop(); });

  this.client.addListener('error', function (err) {
    console.error(err);
  });

  this.client.addListener('message' + this.channel, function (from, message) {
    if (message.match(new RegExp('^' + self.nick))) {

      var parts = message.split(' '),
        command = parts[1],
        args = parts.slice(2);

      if (command === undefined) {
        self.say('Usage: %s <command> <arg1> ... <argN>', self.nick);
      } else if (commands[command]) {
        commands[command].apply(self, args);  
      } else {
        self.say('Command \'' + command + '\' is not supported');
      }
    }
  });

  setTimeout(function () {
    self.client.join(self.channel);
  }, 1000);

};

Bot.prototype.stop = function () {
  this.client.part(this.channel);
  process.exit(0);
};

Bot.prototype.say = function () {
  var message = util.format.apply(this, arguments);
  this.client.say(this.channel, message);
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

function start(host, channel) {

  var commands = {
    build: _build,
    stop: _stop,
    dashboard: _dashboard,
    discover: _discover,
    executor: _executor,
    job: _job,
    queue: _queue,
    ver: _version
  };

  bot = new Bot(host, channel);
  bot.start(commands);
}

exports.start = start;