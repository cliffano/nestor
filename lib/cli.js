/*jshint esnext: true */
const COLORS = {  
  OK: 'green',
  ABORTED: 'grey',
  FAIL: 'red',
  WARN: 'yellow'
};

var _ = require('underscore'),
  bag = require('bagofcli'),
  BuildLight = require('./notifiers/buildlight'),
  colors = require('colors'),
  commander = require('commander'),
  irc = require('./irc'),
  Jenkins = require('./jenkins'),
  NinjaBlocks = require('./notifiers/ninjablocks'),
  _url = require('url');

function __exec(args, cb) {
  // use url flag or JENKINS_URL environment variable if provided
  var url = (args && args.parent) ? (args.parent.url || process.env.JENKINS_URL) : undefined;

  // if URL value and interactive flag are specified, then prompt for authentication details
  if (url && args.parent && args.parent.interactive) {
    commander.prompt('Username: ', function (user) {
      commander.password('Password: ', function (pass) {
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

function _build(jobName, params, args) {
  if (!args) {
    args = params || {};
  }

  const PENDING = 5000;
  var message = 'Job %s was started successfully',
    cb;

  if (args.console) {
    cb = function (err, result) {
      if (err) {
        bag.exit(err, result);
      } else {
        console.log(message, jobName);
        // wait for pending period before calling console
        setTimeout(function () {
          _console(jobName);
        }, args.pending || PENDING);
      }
    };
  } else {
    cb = bag.exitCb(null, function (result) {
      console.log(message, jobName);
    });
  }

  function execCb(jenkins) {
    jenkins.build(jobName, (_.isString(params)) ? params : undefined, cb);
  }
  __exec(args, execCb);
}

function _console(jobName, args) {
  if (!args) {
    args = jobName || {};
  }

  function execCb(jenkins) {
    jenkins.console(jobName, bag.exit);
  }
  __exec(args, execCb);
}

function _stop(jobName, args) {
  if (!args) {
    args = jobName || {};
  }

  function execCb(jenkins) {
    jenkins.stop(
      jobName,
      bag.exitCb(null, function (result) {
        console.log('Job %s was stopped successfully', jobName);
      })
    ); 
  }
  __exec(args, execCb);
}

function _dashboard(args) {
  function execCb(jenkins) {
    jenkins.dashboard(bag.exitCb(null, function (result) {
      if (result.length === 0) {
        console.log('Jobless Jenkins');
      } else {
        result.forEach(function (job) {
          console.log('%s - %s', job.status[COLORS[job.status] || 'grey'], job.name);
        });
      }
    }));
  }
  __exec(args, execCb);
}

function _discover(host, args) {
  if (!args) {
    args = host || {};
  }

  host = (_.isString(host)) ? host : 'localhost';

  function execCb(jenkins) {
    jenkins.discover(host, bag.exitCb(null, function (result) {
      console.log('Jenkins ver. %s is running on %s',
          result.hudson.version[0],
          (result.hudson.url && result.hudson.url[0]) ? result.hudson.url[0] : host);
    }));
  }
  __exec(args, execCb);
}

function _executor(args) {
  function execCb(jenkins) {
    jenkins.executor(bag.exitCb(null, function (result) {
      if (!_.isEmpty(_.keys(result))) {
        _.keys(result).forEach(function (computer) {
          console.log('+ ' + computer);
          result[computer].forEach(function (executor) {
            if (executor.idle) {
              console.log('  - idle');
            } else {
              console.log('  - %s | %s%%s', executor.name, executor.progress, (executor.stuck) ? ' stuck!' : '');
            }
          });
        });
      } else {
        console.log('No executor found');
      }
    }));
  }
  __exec(args, execCb);
}

function _job(name, args) {
  if (!args) {
    args = name || {};
  }

  function execCb(jenkins) {
    jenkins.job(name, bag.exitCb(null, function (result) {
      console.log('%s | %s', name, result.status[COLORS[result.status] || 'grey']);
      result.reports.forEach(function (report) {
        console.log(' - %s', report);
      });
    }));
  }
  __exec(args, execCb);
}

function _queue(args) {
  function execCb(jenkins) {
    jenkins.queue(bag.exitCb(null, function (result) {
      if (result.length === 0) {
        console.log('Queue is empty');
      } else {
        result.forEach(function (job) {
          console.log('- %s', job);
        });
      }
    }));
  }
  __exec(args, execCb);
}

function _version(args) {
  function execCb(jenkins) {
    jenkins.version(bag.exitCb(null, function (result) {
      console.log('Jenkins ver. %s', result);
    }));
  }
  __exec(args, execCb);
}

function _irc(host, channel, nick) {
  nick = (_.isString(nick)) ? nick : undefined;
  irc.start(host, channel, nick);
}

function _feed(args) {
  args = args || {};
  var opts = {
    jobName: args.job,
    viewName: args.view
  };

  function execCb(jenkins) {
    jenkins.feed(opts, bag.exitCb(null, function (result) {
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

function _ninja(args) {
  var ninjaBlocks = new NinjaBlocks(process.env.NINJABLOCKS_TOKEN);
  __monitor(ninjaBlocks, args);
}

function _buildLight(args) {
  var buildLight = new BuildLight({
    scheme: args.scheme ? args.scheme.split(',') : undefined,
    usbled: args.usbled
  });
  __monitor(buildLight, args);
}

/**
 * Execute Nestor CLI.
 */
function exec() {

  var actions = {
    commands: {
      build: { action: _build },
      console: { action: _console },
      stop: { action: _stop },
      dashboard: { action: _dashboard },
      discover: { action: _discover },
      executor: { action: _executor },
      job: { action: _job },
      queue: { action: _queue },
      ver: { action: _version },
      irc: { action: _irc },
      feed: { action: _feed },
      ninja: { action: _ninja },
      buildlight: { action: _buildLight }
    }
  };

  bag.command(__dirname, actions);
}

exports.exec = exec;
