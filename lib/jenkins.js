"use strict";
import cron from 'cron';
import jenkins from './api/jenkins.js';
import job from './api/job.js';
import Swaggy from 'swaggy-jenkins';
import _url from 'url';
import util from './cli/util.js';
import view from './api/view.js';
import fs from 'fs';

function _authFail(result, cb) {
  cb(new Error('Authentication failed - incorrect username and/or password'));
}

function _authRequire(result, cb) {
  cb(new Error('Jenkins requires authentication - please set username and password'));
}

/**
 * class Jenkins
 *
 * @param {String} url: Jenkins URL, fallback to JENKINS_URL environment variable, otherwise default to http://localhost:8080
 */
class Jenkins {

  constructor(url) {

    this.url = url || process.env.JENKINS_URL || 'http://localhost:8080';

    // base URL is needed for functionalities that operate against base Jenkins path
    // this is needed for retrieving Jenkins crumb where the URL might contain paths to folders,
    // but the the Jenkins crumb retrieval still needs to be executed against the base Jenkins path
    const parsedUrl = _url.parse(this.url);
    this.baseUrl = this.url.replace(parsedUrl.path, '');

    const cert = process.env.JENKINS_CERT;
    const ca = process.env.JENKINS_CA;
    const key = process.env.JENKINS_KEY;
    this.opts = {
      handlers: {
        401: _authFail,
        403: _authRequire
      }
    };

    this.remoteAccessApi = new Swaggy.RemoteAccessApi();
    this.remoteAccessApi.apiClient.basePath = this.url;

    // a new Swaggy.ApiClient must be created here in order
    // to force baseApi to not share the same ApiClient as
    // remoteAccessApi
    // this is necessary because baseApi uses a URL that could be
    // different to remoteAccessApi
    this.baseApi = new Swaggy.BaseApi(new Swaggy.ApiClient());
    this.baseApi.apiClient.basePath = this.baseUrl;


    if (cert) {
      const key_path = key.split(':')[0];
      const passphrase = key.split(':')[1];
      this.opts.agentOptions = {
        passphrase: passphrase,
        secureProtocol: 'TLSv1_method'
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
}

/**
 * Add Jenkins crumb header to instance.
 * This is needed for Jenkins installations that have CSRF protection enabled.
 * New installations of Jenkins starting version 2.x enables CSRF protection by default.
 * https://wiki.jenkins-ci.org/display/JENKINS/CSRF+Protection
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
function csrf(cb) {
  const self = this;

  this.opts.headers = this.opts.headers || {};

  function resultCb(err, data, response) {
    if (!err) {
      self.opts.headers[data.crumbRequestField] = data.crumb;
      self.opts.headers.jenkinsCrumb = data.crumb;
    }
    cb(err, data);
  }

  this.crumb(resultCb);
}

/**
 * Summarise executor information from computers array.
 *
 * @param {Array} computers: computers array, part of Jenkins#computer result
 * @return executor summary object
 */
function executorSummary(computers) {

  const data = {};

  computers.forEach(function (computer) {

    let idleCount   = 0;
    let activeCount = 0;

    data[computer.displayName] = { executors: [] };

    computer.executors.forEach(function (executor) {
      data[computer.displayName].executors.push({
        idle: executor.idle,
        stuck: executor.likelyStuck,
        progress: executor.progress,
        name: (!executor.idle && executor.currentExecutable.url) ?
          executor.currentExecutable.url.replace(/.*\/job\//, '').replace(/\/.*/, '') :
          undefined
      });

      if (executor.idle) {
        idleCount += 1;
      } else {
        activeCount += 1;
      }
    });

    const summary = [];
    if (activeCount > 0) {
      summary.push(`${activeCount} active`);
    }
    if (idleCount > 0) {
      summary.push(`${idleCount} idle`);
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
  const self = this;

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

      let hasRed        = false;
      let hasYellow     = false;
      let hasNonSuccess = false;
      let hasSuccess    = false;

      let successColor;
      let nonSuccessColor;

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

      let resultColor;
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

Jenkins.prototype.csrf = csrf;
Jenkins.prototype.discover = jenkins.discover;
Jenkins.prototype.computer = jenkins.computer;
Jenkins.prototype.crumb = jenkins.crumb;
Jenkins.prototype.info = jenkins.info;
Jenkins.prototype.monitor = monitor;
Jenkins.prototype.parseFeed = jenkins.parseFeed;
Jenkins.prototype.queue = jenkins.queue;
Jenkins.prototype.version = jenkins.version;

Jenkins.prototype.createJob = job.create;
Jenkins.prototype.readJob = job.read;
Jenkins.prototype.readLatestJob = job.readLatest;
Jenkins.prototype.updateJob = job.update;
Jenkins.prototype.deleteJob = job.delete;
Jenkins.prototype.buildJob = job.build;
Jenkins.prototype.checkBuildStarted = job.checkStarted;
Jenkins.prototype.stopJob = job.stop;
Jenkins.prototype.streamJobConsole = job.streamConsole;
Jenkins.prototype.enableJob = job.enable;
Jenkins.prototype.disableJob = job.disable;
Jenkins.prototype.copyJob = job.copy;
Jenkins.prototype.fetchJobConfig = job.fetchConfig;
Jenkins.prototype.parseJobFeed = job.parseFeed;

Jenkins.prototype.createView = view.create;
Jenkins.prototype.readView = view.read;
Jenkins.prototype.updateView = view.update;
Jenkins.prototype.fetchViewConfig = view.fetchConfig;
Jenkins.prototype.parseViewFeed = view.parseFeed;

Jenkins.executorSummary = executorSummary;

export {
  Jenkins as default
};
