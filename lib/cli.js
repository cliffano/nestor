"use strict";
import bag from 'bagofcli';
import Jenkins from './jenkins.js';
import jenkins from './cli/jenkins.js';
import job from './cli/job.js';
import p from 'path';
import _url from 'url';
import view from './cli/view.js';

const DIRNAME = p.dirname(import.meta.url).replace('file://', '');

function __exec(args, cb) {
  // use url flag or JENKINS_URL environment variable if provided
  const url = (args && args.parent) ? (args.parent.url || process.env.JENKINS_URL) : undefined;

  function init(url, cb) {
    const jenkins = new Jenkins(url);
    jenkins.csrf(function (err, result) {
      cb(jenkins);
    });
  }

  // if URL value and interactive flag are specified, then prompt for authentication details
  if (url && args.parent && args.parent.interactive) {
    bag.lookupConfig(['Username', 'Password'], { prompt: true }, function (err, results) {
      const parsedUrl = new URL(url);
      parsedUrl.username = results.Username;
      parsedUrl.password = results.Password;
      init(parsedUrl.toString(), cb);
    });
  // otherwise fallback to default URL
  } else {
    init(url, cb);
  }
}

/**
 * Execute Nestor CLI.
 */
function exec() {

  const actions = {
    commands: {
      'dashboard': { action: jenkins.dashboard(__exec) },
      'discover': { action: jenkins.discover(__exec) },
      'executor': { action: jenkins.executor(__exec) },
      'feed': { action: jenkins.feed(__exec) },
      'queue': { action: jenkins.queue(__exec) },
      'ver': { action: jenkins.version(__exec) },
      'create': { action: job.create(__exec) },
      'create-job': { action: job.create(__exec) },
      'job': { action: job.read(__exec) },
      'read-job': { action: job.read(__exec) },
      'last': { action: job.readLatest(__exec) },
      'update': { action: job.update(__exec) },
      'update-job': { action: job.update(__exec) },
      'delete': { action: job.delete(__exec) },
      'delete-job': { action: job.delete(__exec) },
      'build': { action: job.build(__exec) },
      'build-job': { action: job.build(__exec) },
      'stop': { action: job.stop(__exec) },
      'stop-job': { action: job.stop(__exec) },
      'console': { action: job.console(__exec) },
      'enable': { action: job.enable(__exec) },
      'enable-job': { action: job.enable(__exec) },
      'disable': { action: job.disable(__exec) },
      'disable-job': { action: job.disable(__exec) },
      'copy': { action: job.copy(__exec) },
      'copy-job': { action: job.copy(__exec) },
      'config': { action: job.fetchConfig(__exec) },
      'fetch-job-config': { action: job.fetchConfig(__exec) },
      'create-view': { action: view.create(__exec) },
      'update-view': { action: view.update(__exec) },
      'fetch-view-config': { action: view.fetchConfig(__exec) }
    }
  };

  bag.command(DIRNAME, actions);
}

const exports = {
  exec: exec,
  __exec: __exec
};

export {
  exports as default
};
