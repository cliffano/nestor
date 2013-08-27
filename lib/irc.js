var _ = require('lodash'),
  Bot = require('./bot'),
  Jenkins = require('./jenkins'),
  jenkins = new Jenkins(),
  text = require('bagoftext'),
  bot;

function _build(jobName, params) {
  jenkins.build(jobName, (_.isString(params)) ? params : undefined, bot.handleCb(function (result) {
    bot.say(text.__('Job %s was started successfully'), jobName);
  }));
}

function _stop(jobName) {
  jenkins.stop(jobName, bot.handleCb(function (result) {
    bot.say(text.__('Job %s was stopped successfully'), jobName);
  }));
}

function _dashboard() {
  jenkins.dashboard(bot.handleCb(function (result) {
    if (result.length === 0) {
      bot.say(text.__('Jobless Jenkins'));
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
    bot.say(text.__('Jenkins ver. %s is running on %s'),
        result.hudson.version[0],
        (result.hudson.url && result.hudson.url[0]) ? result.hudson.url[0] : host);
  }));
}

function _executor() {
  jenkins.executor(bot.handleCb(function (result) {
    if (!_.isEmpty(_.keys(result))) {
      _.keys(result).forEach(function (computer) {
        bot.say('+ %s | %s', computer, result[computer].summary);
        result[computer].executors.forEach(function (executor) {
          if (!executor.idle) {
            bot.say('  - %s | %s%%s', executor.name, executor.progress, (executor.stuck) ? ' stuck!' : '');
          }
        });
      });
    } else {
      bot.say(text.__('No executor found'));
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
      bot.say(text.__('Queue is empty'));
    } else {
      result.forEach(function (job) {
        bot.say('- %s', job);
      });
    }
  }));
}

function _version() {
  jenkins.version(bot.handleCb(function (result) {
    bot.say(text.__('Jenkins ver. %s'), result);
  }));
}

/**
 * Start IRC bot.
 *
 * @param {String} host: IRC server host
 * @param {String} channel: IRC channel to join
 * @param {String} nick: optional nickname, defaults to 'nestor'
 */
function start(host, channel, nick) {
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

  bot = new Bot(commands);
  bot.connect(host, channel, { nick: nick });
}

exports.start = start;
