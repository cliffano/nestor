var _ = require('lodash'),
  async = require('async'),
  commander = require('commander'),
  cron = require('cron'),
  dgram = require('dgram'),
  feedparser = require('feedparser'),
  fs = require('fs'),
  p = require('path'),
  req = require('bagofrequest'),
  request = require('request'),
  text = require('bagoftext'),
  xml2js = require('xml2js'),
  moment = require('moment');

var jenkins = require('./api/jenkins');
var job     = require('./api/job');
var view    = require('./api/view');

text.initLocales(__dirname);

/**
 * class Jenkins
 *
 * @param {String} url: Jenkins URL, fallback to JENKINS_URL environment variable, otherwise default to http://localhost:8080
 */
function Jenkins(url) {

  function _authFail(result, cb) {
    cb(new Error(text.__('Authentication failed - incorrect username and/or password in Jenkins URL')));
  }

  function _authRequire(result, cb) {
    cb(new Error(text.__('Jenkins requires authentication - set username and password in Jenkins URL')));
  }

  this.url = url || process.env.JENKINS_URL || 'http://localhost:8080';
  this.opts = {
    handlers: {
      401: _authFail,
      403: _authRequire
    }
  };
}

/**
 * Retrieve status and date for the most recently completed build.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.last = function (name, cb) {

    function _success(result, cb) {
        var _build = JSON.parse(result.body),
            buildMoment,
            data = {
                building: _build.building,
                result: _build.result
            };

        if (_build.building > 0) {
            buildMoment = moment(_build.timestamp);
            data.buildDateDistance = "Started " + buildMoment.fromNow();

        } else {
            buildMoment = moment(_build.timestamp + _build.duration);
            data.buildDateDistance = "Ended " + buildMoment.fromNow();
        }

        data.buildDate = buildMoment.toISOString();

        cb(null, data);
    }

    function _notFound(result, cb) {
        cb(new Error(text.__('No build could be found for job %s', name)));
    }

    this.opts.handlers[200] = _success;
    this.opts.handlers[404] = _notFound;

    req.request('get', this.url + '/job/' + name + '/lastBuild/api/json', this.opts, cb);
};

/**
 * Summarise executor information from computers array.
 *
 * @param {Array} computers: computers array, part of Jenkins#computer result
 * @return executor summary object
 */
function executorSummary(computers) {

  var data = {};

  computers.forEach(function (computer) {

    var idleCount   = 0;
    var activeCount = 0;

    data[computer.displayName] = { executors: [] };

    computer.executors.forEach(function (executor) {

      data[computer.displayName].executors.push({
        idle: executor.idle,
        stuck: executor.likelyStuck,
        progress: executor.progress,
        name: (!executor.idle) ?
          executor.currentExecutable.url.replace(/.*\/job\//, '').replace(/\/.*/, '') :
          undefined
      });

      if (executor.idle) {
        idleCount += 1;
      } else {
        activeCount += 1;
      }
    });

    var summary = [];
    if (activeCount > 0) {
      summary.push(text.__('%d active', activeCount)); 
    }
    if (idleCount > 0) {
      summary.push(text.__('%d idle', idleCount));
    }

    data[computer.displayName].summary = summary.join(', ');
  });

  return data;
}

Jenkins.executorSummary = executorSummary;

Jenkins.prototype.discover         = jenkins.discover;
Jenkins.prototype.computer         = jenkins.computer; 
Jenkins.prototype.info             = jenkins.info;
Jenkins.prototype.queue            = jenkins.queue;
Jenkins.prototype.version          = jenkins.readVersion;

Jenkins.prototype.createJob        = job.create;
Jenkins.prototype.readJob          = job.read;
Jenkins.prototype.updateJob        = job.update;
Jenkins.prototype.deleteJob        = job.delete;
Jenkins.prototype.buildJob         = job.build;
Jenkins.prototype.stopJob          = job.stop;
Jenkins.prototype.streamJobConsole = job.streamConsole;
Jenkins.prototype.enableJob        = job.enable;
Jenkins.prototype.disableJob       = job.disable;
Jenkins.prototype.copyJob          = job.copy;
Jenkins.prototype.fetchJobConfig   = job.fetchConfig;

Jenkins.prototype.createView       = view.create;
Jenkins.prototype.readView         = view.read;
Jenkins.prototype.updateView       = view.update;
Jenkins.prototype.fetchViewConfig  = view.fetchConfig;

/**
 * Retrieve Jenkins feed or job feed.
 * If jobName option is specified, then use the job feed.
 * If viewName option is specified, then use the view feed.
 * Otherwise defaults to all feed.
 *
 * @param {Object} opts: optional
 * - jobName: Jenkins job name
 * - viewName: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.feed = function (opts, cb) {
  opts = opts || {};
  var url;
  if (opts.jobName) {
    url = this.url + '/job/' + opts.jobName + '/rssAll';
  } else if (opts.viewName) {
    url = this.url + '/view/' + opts.viewName + '/rssAll';
  } else {
    url = this.url + '/rssAll';
  }
  feedparser.parseUrl(url, function (err, meta, articles) {
    cb(err, articles);
  });
};

/**
 * Monitor Jenkins latest build status on a set interval.
 *
 * @param {Object} opts: optional
 * - jobName: Jenkins job name
 * - viewName: Jenkins view name
 * - schedule: cron scheduling definition in standard * * * * * * format, default: 0 * * * * * (every minute)
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.monitor = function (opts, cb) {
  var self = this;

  function _notify() {
    self.dashboard(opts, function (err, result) {
      if (!err) {
        result = self._statusByName({ jobName: opts.jobName }, result);
      }
      cb(err, result);
    });
  }

  _notify();
  new cron.CronJob(opts.schedule || '0 * * * * *', _notify).start();
};

Jenkins.prototype._statusByColor = function (color) {

  const STATUS = {  
    blue: 'OK',
    green: 'OK',
    grey: 'ABORTED',
    red: 'FAIL',
    yellow: 'WARN'
  };

  // Jenkins color value can contain either a color, color_anime, or status in job.color field,
  // hence to get color/status value out of the mix we need to remove the postfix _anime,
  // _anime postfix only exists on a job currently being built
  color = color.replace(/_anime/, '');

  return (STATUS[color]) || color.toUpperCase();
};

Jenkins.prototype._statusByName = function (opts, data) {
  const STATUS = ['FAIL', 'WARN', 'ABORTED', 'OK'];

  if (opts.jobName) {
    data = data.filter(function (item) {
      return item.name === opts.jobName;
    });
  }

  var uniq = _.uniq(_.pluck(data, 'status')),
    status = null;
  
  STATUS.some(function (item) {
    if (uniq.indexOf(item) !== -1) {
      status = item;
      return true;
    }
  });

  return status;
};

module.exports = Jenkins;
