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
  irc = require('./irc'),
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

// function _build(jobName, params, args) {
//   if (!args) {
//     args = params || {};
//   }

//   const PENDING = 5000;
//   var message = text.__('Job %s was started successfully'),
//     cb;

//   if (args.console) {
//     cb = function (err, result) {
//       if (err) {
//         cli.exit(err, result);
//       } else {
//         console.log(message, jobName);
//         // wait for pending period before calling console
//         setTimeout(function () {
//           _console(jobName);
//         }, args.pending || PENDING);
//       }
//     };
//   } else {
//     cb = cli.exitCb(null, function (result) {
//       console.log(message, jobName);
//     });
//   }

//   function execCb(jenkins) {
//     jenkins.build(jobName, (_.isString(params)) ? params : undefined, cb);
//   }
//   __exec(args, execCb);
// }

function _buildAll(args) {
  function execCb(jenkins) {
    jenkins.filteredBuild(null, cli.exit);
  }
  __exec(args, execCb);
}

function _buildFail(args) {
  function execCb(jenkins) {
    jenkins.filteredBuild({ status: 'FAIL' }, cli.exit);
  }
  __exec(args, execCb);
}

// function _console(jobName, args) {
//   function execCb(jenkins) {
//     jenkins.console(jobName, cli.exit);
//   }
//   __exec(args, execCb);
// }

function _job(name, args) {
  function execCb(jenkins) {
    jenkins.job(name, cli.exitCb(null, function (result) {
      var status = text.__(result.status),
        color = [COLORS[result.status] || 'grey'];
      console.log('%s | %s', name, status[color]);
      result.reports.forEach(function (report) {
        console.log(' - %s', report);
      });
    }));
  }
  __exec(args, execCb);
}

function _last(name, args) {
  function execCb(jenkins) {
    jenkins.last(name, cli.exitCb(null, function (result) {
      var resultColor = [COLORS[result.result] || 'grey'];
      console.log('%s | %s', name, result.building ? "BUILDING".yellow : result.result[resultColor]);
      console.log(' - %s [%s]', result.buildDate, result.buildDateDistance);
    }));
  }
  __exec(args, execCb);
}

function _irc(host, channel, nick) {
  irc.start(host, channel, nick);
}

function _feed(args) {
  args = args || {};
  var opts = {
    jobName: args.job,
    viewName: args.view
  };

  function execCb(jenkins) {
    jenkins.feed(opts, cli.exitCb(null, function (result) {
      result.forEach(function (article) {
        console.log(article.title);
      });
    }));
  }
  __exec(args, execCb);
}

function __monitor(notifier, args) {
  args = args || {};
  var opts = {
    jobName: args.job,
    viewName: args.view,
    schedule: args.schedule
  };
  function execCb(jenkins) {
    jenkins.monitor(opts, function (err, result) {
      if (err) {
        console.error(err.message);
      } else {
        notifier.notify(result);
      }
    });
  }
  __exec(args, execCb);
}

/**
 * Execute Nestor CLI.
 */
function exec() {

  var actions = {
    commands: {
      'build-all': { action: _buildAll },
      'build-fail': { action: _buildFail },
      'last': { action: _last },
      'dashboard'        : { action: jenkins.dashboard(__exec) },
      'discover'         : { action: jenkins.discover(__exec) },
      'executor'         : { action: jenkins.executor(__exec) },
      'queue'            : { action: jenkins.queue(__exec) },
      'ver'              : { action: jenkins.version(__exec) },
      'create'           : { action: job.create(__exec) },
      'create-job'       : { action: job.create(__exec) },
      'job'              : { action: job.read(__exec) },
      'read-job'         : { action: job.read(__exec) },
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
      'fetch-view-config': { action: view.fetchConfig(__exec) },
      irc: { action: _irc },
      feed: { action: _feed }
    }
  };

  cli.command(__dirname, actions);
}

exports.exec = exec;
