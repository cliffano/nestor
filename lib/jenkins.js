var cron    = require('cron');
var jenkins = require('./api/jenkins');
var job     = require('./api/job');
var text    = require('bagoftext');
var util    = require('./cli/util');
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

/**
 * Monitor Jenkins latest build status on a set interval.
 *
 * @param {Object} opts: optional
 * - job: Jenkins job name
 * - view: Jenkins view name
 * - schedule: cron scheduling definition in standard * * * * * * format, default: 0 * * * * * (every minute)
 * @param {Function} cb: standard cb(err, result) callback
 */
function monitor(opts, cb) {
  var self = this;

  function jobResultCb(err, result) {
    if (!err) {
      result = util.statusByColor(result.color);
    }
    cb(err, result);    
  }

  function jobsResultCb(err, result) {
    if (!err) {
      var latestJob = result.jobs[0];
      result = util.statusByColor(latestJob.color);
    }
    cb(err, result);
  }

  function _notify() {
    if (opts.job) {
      self.readJob(opts.job, jobResultCb);
    } else if (opts.view) {
      self.readView(opts.view, jobsResultCb);
    } else {
      self.info(jobsResultCb);
    }
  }

  _notify();
  new cron.CronJob(opts.schedule || '0 * * * * *', _notify).start();
}

Jenkins.prototype.discover         = jenkins.discover;
Jenkins.prototype.computer         = jenkins.computer; 
Jenkins.prototype.info             = jenkins.info;
Jenkins.prototype.monitor          = monitor;
Jenkins.prototype.parseFeed        = jenkins.parseFeed;
Jenkins.prototype.queue            = jenkins.queue;
Jenkins.prototype.version          = jenkins.readVersion;

Jenkins.prototype.createJob        = job.create;
Jenkins.prototype.readJob          = job.read;
Jenkins.prototype.readLatestJob    = job.readLatest;
Jenkins.prototype.updateJob        = job.update;
Jenkins.prototype.deleteJob        = job.delete;
Jenkins.prototype.buildJob         = job.build;
Jenkins.prototype.stopJob          = job.stop;
Jenkins.prototype.streamJobConsole = job.streamConsole;
Jenkins.prototype.enableJob        = job.enable;
Jenkins.prototype.disableJob       = job.disable;
Jenkins.prototype.copyJob          = job.copy;
Jenkins.prototype.fetchJobConfig   = job.fetchConfig;
Jenkins.prototype.parseJobFeed     = job.parseFeed;

Jenkins.prototype.createView       = view.create;
Jenkins.prototype.readView         = view.read;
Jenkins.prototype.updateView       = view.update;
Jenkins.prototype.fetchViewConfig  = view.fetchConfig;
Jenkins.prototype.parseViewFeed    = view.parseFeed;

Jenkins.executorSummary = executorSummary;

module.exports = Jenkins;
