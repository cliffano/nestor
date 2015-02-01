const COLORS = {  
  OK: 'green',
  ABORTED: 'grey',
  FAIL: 'red',
  WARN: 'yellow',
  SUCCESS: 'green',
  FAILURE: 'red',
  UNSTABLE: 'yellow'
};

var _ = require('lodash'),
  cli = require('bagofcli'),
  colors = require('colors'),
  commander = require('commander'),
  Jenkins = require('./jenkins'),
  text = require('bagoftext'),
  _url = require('url');

var jenkins = require('./cli/jenkins');
var job     = require('./cli/job');
var view    = require('./cli/view');

function __exec(args, cb) {
  // use url flag or JENKINS_URL environment variable if provided
  var url = (args && args.parent) ? (args.parent.url || process.env.JENKINS_URL) : undefined;

  // if URL value and interactive flag are specified, then prompt for authentication details
  if (url && args.parent && args.parent.interactive) {
    commander.prompt(text.__('Username: '), function (user) {
      commander.password(text.__('Password: '), function (pass) {
        var parsedUrl = _url.parse(url);
        parsedUrl.auth = user + ':' + pass;
        url = _url.format(parsedUrl);
        cb(new Jenkins(url));
      });
    });

  // otherwise fallback to default URL
  } else {
    cb(new Jenkins(url));
  }
}

/**
 * Execute Nestor CLI.
 */
function exec() {

  var actions = {
    commands: {
      'dashboard'        : { action: jenkins.dashboard(__exec) },
      'discover'         : { action: jenkins.discover(__exec) },
      'executor'         : { action: jenkins.executor(__exec) },
      'feed'             : { action: jenkins.feed(__exec) },
      'queue'            : { action: jenkins.queue(__exec) },
      'ver'              : { action: jenkins.version(__exec) },
      'create'           : { action: job.create(__exec) },
      'create-job'       : { action: job.create(__exec) },
      'job'              : { action: job.read(__exec) },
      'read-job'         : { action: job.read(__exec) },
      'last'             : { action: job.readLatest(__exec) },
      'update'           : { action: job.update(__exec) },
      'update-job'       : { action: job.update(__exec) },
      'delete'           : { action: job.delete(__exec) },
      'delete-job'       : { action: job.delete(__exec) },
      'build'            : { action: job.build(__exec) },
      'build-job'        : { action: job.build(__exec) },
      'stop'             : { action: job.stop(__exec) },
      'stop-job'         : { action: job.stop(__exec) },
      'console'          : { action: job.console(__exec) },
      'enable'           : { action: job.enable(__exec) },
      'enable-job'       : { action: job.enable(__exec) },
      'disable'          : { action: job.disable(__exec) },
      'disable-job'      : { action: job.disable(__exec) },
      'copy'             : { action: job.copy(__exec) },
      'copy-job'         : { action: job.copy(__exec) },
      'config'           : { action: job.fetchConfig(__exec) },
      'fetch-job-config' : { action: job.fetchConfig(__exec) },
      'create-view'      : { action: view.create(__exec) },
      'update-view'      : { action: view.update(__exec) },
      'fetch-view-config': { action: view.fetchConfig(__exec) }
    }
  };

  cli.command(__dirname, actions);
}

exports.exec = exec;
