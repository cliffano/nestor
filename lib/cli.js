var _ = require('underscore'),
  bag = require('bagofholding'),
  jenkins = require('./jenkins');

/**
 * cli#exec
 * 
 * Execute jenkins 
 **/
function exec() {

  var url = process.env.JENKINS_URL || 'http://localhost:8080';

  function _exec(command) {
    return function () {
      new jenkins(url)[command](bag.cli.exitCb());
    };
  }
/*
  function _build() {
    var args = Array.prototype.slice.call(_build['arguments']),
      jobs = args.slice(0, args.length - 1);
    
    jobs.forEach(function (job) {
      new jenkins(url).build(job);
    });
  }
*/
  function _dashboard() {
    return function () {
      new jenkins(url).dashboard(bag.cli.exitCb(null, function (result) {
        if (result.length === 0) {
          console.log('Jobless Jenkins');
        } else {
          result.forEach(function (job) {
            console.log('%s - %s', job.status, job.name);
          });
        }
      }));
    }; 
  }

  function _discover() {
    return function (host) {
      new jenkins(url).discover(host, bag.cli.exitCb(null, function (result) {
        console.log('Jenkins ver. %s is running on %s', result.version, result.url);
      }));
    };
  }

  function _executor() {
    return function () {
      new jenkins(url).executor(bag.cli.exitCb(null, function (result) {
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
    };
  }

  function _job() {
    return function (jobName) {
      new jenkins(url).job(jobName, bag.cli.exitCb(null, function (result) {
        console.log('%s | %s', jobName, result.status);
        result.reports.forEach(function (report) {
          console.log(' - %s', report);
        });
      }));
    };
  }

  function _queue() {
    return function () {
      new jenkins(url).queue(bag.cli.exitCb(null, function (result) {
        if (result.length === 0) {
          console.log('Queue is empty');
        } else {
          result.forEach(function (job) {
            console.log('- %s', job);
          });
        }
      }));
    }; 
  }

  function _version() {
    return function () {
      new jenkins(url).version(bag.cli.exitCb(null, function (result) {
        console.log('Jenkins ver. %s', result);
      }));
    };
  }
  
  var commands = {
    build: {
      desc: 'Trigger one or more builds',
      action: _exec('build')
    },
    dashboard: {
      desc: 'View status of all jobs',
      action: _dashboard()
    },
    discover: {
      desc: 'Discover Jenkins instance running on a specified host',
      action: _discover()
    },
    executor: {
      desc: 'View executors\' status (running builds)',
      action: _executor()
    },
    job: {
      desc: 'View job status reports',
      action: _job()
    },
    queue: {
      desc: 'View queued jobs',
      action: _queue()
    },
    ver: {
      desc: 'View Jenkins version number',
      action: _version()
    }
  };

  bag.cli.parse(commands, __dirname);
}

exports.exec = exec;
/*
var _ = require('underscore'),
  fs = require('fs'),
  Jenkins = require('./jenkins').Jenkins,
  nomnom = require('nomnom'),
  p = require('path'),
  url = require('url'),
  // Jenkins on Winstone uses http://localhost:8080 by default
  jenkins = new Jenkins(url.parse(process.env.JENKINS_URL || 'http://localhost:8080'));

function exec() {

  var scriptOpts = {
    version: {
      string: '-v',
      flag: true,
      help: 'Nestor version number',
      callback: function () {
        return JSON.parse(fs.readFileSync(p.join(__dirname, '../package.json'))).version;
      }
    }
  };

  function _process(fn) {
    return function (err, result) {
      if (err) {
        console.error(err.message);
        process.exit(1);
      } else {
        fn(result);
        process.exit(0);
      }
    };
  }

  nomnom.scriptName('nestor').opts(scriptOpts);

  nomnom.command('build').callback(function (args) {
    jenkins.build(args._[1], args._[2], _process(function (result) {
      console.log('Job was started successfully');
    }));
  });

  nomnom.command('dashboard').callback(function (args) {
    jenkins.dashboard(_process(function (result) {
      if (result.length === 0) {
        console.log('Jobless Jenkins');
      } else {
        result.forEach(function (job) {
          console.log(job.status + ' - ' + job.name);
        });
      }
    }));
  });
  
  nomnom.command('discover').callback(function (args) {
    jenkins.discover(args._[1] || 'localhost', _process(function (result) {
      console.log('Jenkins ' + result.version + ' found, running at ' + result.url);
    }));
  });

  nomnom.command('executor').callback(function (args) {
    jenkins.executor(_process(function (result) {
      _.keys(result).forEach(function (computer) {
        console.log('+ ' + computer);
        result[computer].forEach(function (executor) {
          if (executor.idle) {
            console.log('  - idle');
          } else {
            console.log('  - ' + executor.progress + '% ' + executor.name);
          }
        });
      });
    }));
  });

  nomnom.command('job').callback(function (args) {
    jenkins.job(args._[1], _process(function (result) {
      console.log('Status: ' + result.status);
      result.reports.forEach(function (report) {
        console.log(report);
      });
    }));
  });

  nomnom.command('queue').callback(function (args) {
    jenkins.queue(_process(function (result) {
      if (result.length === 0) {
        console.log('Queue is empty');
      } else {
        result.forEach(function (job) {
          console.log('- ' + job);
        });
      }
    }));
  });
  
  nomnom.command('version').callback(function (args) {
    jenkins.version(_process(function (result) {
      console.log(result);
    }));
  });

  nomnom.command('').callback(function (args) {
    console.log(nomnom.getUsage());
  });
  
  nomnom.parseArgs();
}
      
exports.exec = exec;
*/