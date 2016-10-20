var cron    = require('cron');
var jenkins = require('./api/jenkins');
var job     = require('./api/job');
var text    = require('bagoftext');
var util    = require('./cli/util');
var view    = require('./api/view');
var fs      = require('fs');

text.initLocales(__dirname);

/**
 * class Jenkins
 *
 * @param {String} url: Jenkins URL, fallback to JENKINS_URL environment variable, otherwise default to http://localhost:8080
 */
function Jenkins(url) {

  function _authFail(result, cb) {
    cb(new Error(text.__('Authentication failed - incorrect username and/or password')));
  }

  function _authRequire(result, cb) {
    cb(new Error(text.__('Jenkins requires authentication - please set username and password')));
  }

  this.url = url || process.env.JENKINS_URL || 'http://localhost:8080';
  var cert = process.env.JENKINS_CERT;
  var ca = process.env.JENKINS_CA;
  var key = process.env.JENKINS_KEY;
  this.opts = {
    handlers: {
      401: _authFail,
      403: _authRequire
    }
  };

  if (cert) {
    var key_path = key.split(":")[0];
    var passphrase = key.split(":")[1];
    this.opts.agentOptions = {
      passphrase: passphrase,
      secureProtocol: "TLSv1_method"
    };
    if(cert && fs.statSync(cert)){
      this.opts.agentOptions.cert = fs.readFileSync(cert);
    }
    if(key_path && fs.statSync(key_path)){
      this.opts.agentOptions.key = fs.readFileSync(key_path);
    }
    if(ca && fs.statSync(ca)){
      this.opts.agentOptions.ca = fs.readFileSync(ca);
    }
  }
}

function csrf(cb) {
  var self = this;

  this.opts.headers = this.opts.headers || {};

  this.crumb(function (err, result) {
    if (err) {
      cb(err);
    } else {
      self.opts.headers[result.crumbRequestField] = result.crumb;
      cb();
    }
  })

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

  function singleJobResultCb(err, result) {
    if (!err) {
      result = util.statusByColor(result.color);
    }
    cb(err, result);
  }

  // when there are multiple jobs, status is derived following these rules:
  // - fail if any job has Jenkins color red
  // - warn if any job has Jenkins color yellow but no red
  // - non-success (e.g. notbuilt) if any job has Jenkins color status but no red and yellow
  // - success only if all jobs are either blue or green
  function multiJobsResultCb(err, result) {
    if (!err) {

      var hasRed        = false;
      var hasYellow     = false;
      var hasNonSuccess = false;
      var hasSuccess    = false;

      var successColor;
      var nonSuccessColor;

      result.jobs.forEach(function (job) {
        if (job.color === 'red') {
          hasRed = true;
        }
        if (job.color === 'yellow') {
          hasYellow = true;
        }
        if (['red', 'yellow', 'blue', 'green'].indexOf(job.color) === -1) {
          hasNonSuccess   = true;
          nonSuccessColor = job.color;
        }
        if (job.color === 'blue' || job.color === 'green') {
          hasSuccess   = true;
          successColor = job.color;
        }
      });

      var resultColor;
      if (hasRed) {
        resultColor = 'red';
      } else if (hasYellow) {
        resultColor = 'yellow';
      } else if (hasNonSuccess) {
        resultColor = nonSuccessColor;
      } else {
        resultColor = successColor;
      }

      result = util.statusByColor(resultColor);
    }
    cb(err, result);
  }

  function _notify() {
    if (opts.job) {
      self.readJob(opts.job, singleJobResultCb);
    } else if (opts.view) {
      self.readView(opts.view, multiJobsResultCb);
    } else {
      self.info(multiJobsResultCb);
    }
  }

  _notify();
  new cron.CronJob(opts.schedule || '0 * * * * *', _notify).start();
}

Jenkins.prototype.csrf              = csrf;
Jenkins.prototype.discover          = jenkins.discover;
Jenkins.prototype.computer          = jenkins.computer;
Jenkins.prototype.crumb             = jenkins.crumb;
Jenkins.prototype.info              = jenkins.info;
Jenkins.prototype.monitor           = monitor;
Jenkins.prototype.parseFeed         = jenkins.parseFeed;
Jenkins.prototype.queue             = jenkins.queue;
Jenkins.prototype.version           = jenkins.version;

Jenkins.prototype.createJob         = job.create;
Jenkins.prototype.readJob           = job.read;
Jenkins.prototype.readLatestJob     = job.readLatest;
Jenkins.prototype.updateJob         = job.update;
Jenkins.prototype.deleteJob         = job.delete;
Jenkins.prototype.buildJob          = job.build;
Jenkins.prototype.checkBuildStarted = job.checkStarted;
Jenkins.prototype.stopJob           = job.stop;
Jenkins.prototype.streamJobConsole  = job.streamConsole;
Jenkins.prototype.enableJob         = job.enable;
Jenkins.prototype.disableJob        = job.disable;
Jenkins.prototype.copyJob           = job.copy;
Jenkins.prototype.fetchJobConfig    = job.fetchConfig;
Jenkins.prototype.parseJobFeed      = job.parseFeed;

Jenkins.prototype.createView        = view.create;
Jenkins.prototype.readView          = view.read;
Jenkins.prototype.updateView        = view.update;
Jenkins.prototype.fetchViewConfig   = view.fetchConfig;
Jenkins.prototype.parseViewFeed     = view.parseFeed;

Jenkins.executorSummary = executorSummary;

module.exports = Jenkins;
