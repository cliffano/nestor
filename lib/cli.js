var _ = require('underscore'),
  fs = require('fs'),
  Jenkins = require('./jenkins').Jenkins,
  nomnom = require('nomnom'),
  p = require('path'),
  url = require('url')
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
    }
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
        result.forEach(function (build) {
          console.log('- ' + build);
        });
      }
    }));
  });
  
  nomnom.command('version').callback(function (args) {
    jenkins.version(_process(function (result) {
      console.log(result);
    }));
  });

  nomnom.parseArgs();
}
      
exports.exec = exec;