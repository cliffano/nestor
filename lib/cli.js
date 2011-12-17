var Jenkins = require('./jenkins').Jenkins,
  nomnom = require('nomnom'),
  url = require('url')
  jenkins = new Jenkins(url.parse(process.env.JENKINS_URL || 'http://localhost:8080'));

function exec() {

  var scriptOpts = {
    version: {
      string: '-v',
      flag: true,
      help: 'AE86 version number',
      callback: function () {
        return JSON.parse(fs.readFileSync(p.join(__dirname, '../package.json'))).version;
      }
    }
  };

  nomnom.scriptName('nestor').opts(scriptOpts);

  nomnom.command('build').callback(function (args) {
    jenkins.build(args._[1], args._[2], function (err, result) {
      console.error("ERR" + err)
      console.log("RESULT" + require('util').inspect(result))
    });
  });

  nomnom.command('dashboard').callback(function (args) {
    jenkins.dashboard(function (err, result) {
      console.error("ERR" + err)
      console.log("RESULT" + require('util').inspect(result))
    });
  });
  
  nomnom.command('discover').callback(function (args) {
    jenkins.discover(args._[1] || 'localhost', function (err, result) {
      console.error("ERR" + err)
      console.log("RESULT" + require('util').inspect(result))
    });
  });

  nomnom.command('executor').callback(function (args) {
    jenkins.executor(function (err, result) {
      console.error("ERR" + err)
      console.log("RESULT" + require('util').inspect(result))
    });
  });

  nomnom.command('job').callback(function (args) {
    jenkins.job(args._[1], function (err, result) {
      console.error("ERR" + err)
      console.log("RESULT" + require('util').inspect(result))
    });
  });

  nomnom.command('queue').callback(function (args) {
    jenkins.queue(function (err, result) {
      console.error("ERR" + err)
      console.log("RESULT" + require('util').inspect(result))
    });
  });
  
  nomnom.command('version').callback(function (args) {
    jenkins.version(function (err, result) {
      console.error("ERR" + err)
      console.log("RESULT" + require('util').inspect(result))
    });
  });

  nomnom.parseArgs();
}
      
exports.exec = exec;

/*
var DEFAULT_URL = 'http://localhost:8080',
    fs = require('fs'),
    nomnom = require('nomnom'),
    path = require('path'),
    Nestor = require('../lib/nestor').Nestor,
    Service = require('../lib/service').Service,
    service = new Service(process.env.JENKINS_URL || DEFAULT_URL),
    nestor = new Nestor(service, function (err) {
        console.error(err.message);
    }),
    args, scriptOpts;

scriptOpts = {
    version: {
        string: '-v',
        flag: true,
        help: 'nestor version number',
        callback: function () {
            return JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).version;
        }
    }
}

nomnom.scriptName('nestor').opts(scriptOpts);
nomnom.command('dashboard').callback(function (args) {
    nestor.dashboard(function (err, result) {
        if (err) {
            console.error(err.message);
        } else if (result.length === 0) {
            console.log('Jobless Jenkins');
        } else {
            result.forEach(function (job) {
                console.log(job.status + '\t' + job.name);
            });
        }
    });
});
nomnom.command('job')
    .opts({
        jobnames: { position: 1, required: true, list: true }
    })
    .callback(function (args) {
        args.jobnames.forEach(function (jobname) {        
            nestor.job(jobname, function (err, result) {
                if (err) {
                    console.error(jobname + ' - ' + err.message);
                } else {
                    console.log(jobname + ' - ' + 'Status: ' + result.status);
                    result.reports.forEach(function (report) {
                        console.log(jobname + ' - ' + report);
                    });
                }
            });
        });
    });
nomnom.command('build').callback(function (args) {
    nestor.build(args._[1], args._[2], function (err, result) {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Job was started successfully');
        }
    });
});
nomnom.command('queue').callback(function (args) {
    nestor.queue(function (err, result) {
        if (err) {
            console.error(err.message);
        } else {
            if (result.length === 0) {
                console.log('Queue is empty');
            } else {
                result.forEach(function (build) {
                    console.log(build);
                });
            }
        }
    });
});
nomnom.command('executor').callback(function (args) {
    nestor.executor(function (err, result) {
        if (err) {
            console.error(err.message);
        } else {
            for (computer in result) {
                if (result.hasOwnProperty(computer)) {
                    console.log('* ' + computer);
                    result[computer].forEach(function (executor) {
                        if (executor.idle) {
                            console.log('idle');
                        } else {
                            console.log(executor.progress + '%\t' + executor.name);
                        }
                    });
                }
            }
        }
    });
});
nomnom.command('discover').callback(function (args) {
    nestor.discover(args._[1], function (err, result) {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Jenkins ' + result.version + ' running at ' + result.url);
        }
    });
});
nomnom.command('version').callback(function (args) {
    nestor.version(function (err, result) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(result);
        }
    });
});
nomnom.parseArgs();
*/