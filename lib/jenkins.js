var _ = require('underscore'),
  request = require('request');

function _request(method, url, handlers, cb) {
  request({
    method: method,
    uri: url
  }, function (err, result) {
    if (err) {
      cb(err);
    } else if (result.statusCode === 401 || result.statusCode === 403) {
      cb(new Error('Jenkins requires authentication - set username and password in JENKINS_URL'));
    } else if (handlers[result.statusCode]) {
      handlers[result.statusCode](result);
    } else {
      cb(new Error('Unexpected status code ' + result.statusCode + ' from Jenkins\nResponse body:\n' + result.body));
    }
  });  
}

function _status(color) {

  var colors = {  
    'blue': 'OK',
    'green': 'OK',
    'grey': 'ABORTED',
    'red': 'FAIL',
    'yellow': 'WARN'
  };

  // remove animation status (only for actively running job)
  color = color.replace(/_anime/, '');

  return (colors[color]) ? (colors[color]) : color.toUpperCase();
}

function Jenkins (url) {
  this.url = url;
}

Jenkins.prototype.dashboard = function (cb) {

  function _success(result) {
    var jobs = JSON.parse(result.body).jobs,
      data = [];

    if (!_.isEmpty(jobs)) {
      jobs.forEach(function (job) {
        data.push({ status: _status(job.color), name: job.name });
      });
    }
    cb(null, data);    
  }

  _request('get', this.url + '/api/json', { 200: _success }, cb);
};

Jenkins.prototype.version = function (cb) {

};

module.exports = Jenkins;

/*
var _ = require('underscore'),
  comm = require('./comm');

function Jenkins(url) {

  var status = {
    'blue': 'OK',
    'green': 'OK',
    'grey': 'ABORT',
    'red': 'FAIL',
    'yellow': 'WARN'
  };

  function _cb(opts, cb) {
    return function (err, result) {
      if (err) {
        cb(err);
      // jenkins also responds with 403 (other than 401) when authentication is required
      } else if (result.statusCode === 401 || result.statusCode === 403) {
        cb(new Error('Username and password are required'));
      } else {
        var fn;
        _.keys(opts).forEach(function (opt) {
          if ((opt === 'ok' && !result.statusCode.toString().match(/^(4|5)/)) ||
              (parseInt(opt, 10) === result.statusCode)) {
            fn = opts[opt];
          }
        });
        if (fn) {
          try {
            cb(null, fn(result));
          } catch (e) {
            cb(e);
          }
        } else {
          cb(new Error('Unexpected status code ' + result.statusCode));
        }
      }
    };
  }

  // trigger a build, support parameterised build
  function build(job, params, cb) {
    var json = { parameter: [] };
    if (params) {
      params.split('&').forEach(function (item) {
        var pair = item.split('=');
        json.parameter.push({ name: pair[0], value: pair[1] });
      });
    }
    comm.http('/job/' + job + '/build?token=nestor&json=' + JSON.stringify(json), 'POST', url, _cb({
      404: function (result) {
        throw new Error('Job does not exist');
      },
      'ok': function (result) {
        return { status: 'ok' };
      }
    }, cb));  
  }

  // list all jobs on the dashboard
  function dashboard(cb) {
    comm.http('/api/json', 'GET', url, _cb({
      'ok': function (result) {
        var jobs = JSON.parse(result.data).jobs, data = [];
        if (jobs && jobs.length > 0) {
          jobs.forEach(function (job) {
            data.push({ status: status[job.color], name: job.name });
          });
        }
        return data;
      }
    }, cb));
  }

  // discover expects host because it's meant to find a jenkins
  // instance on any host, not just localhost
  function discover(host, cb) {
    comm.udp('Long live Jenkins', host, 33848, cb);
  }

  // list executor status on all master slaves
  function executor(cb) {
    comm.http('/computer/api/json?depth=1', 'GET', url, _cb({
      'ok': function (result) {
        var computers = JSON.parse(result.data).computer, data = {};
        computers.forEach(function (computer) {
          data[computer.displayName] = [];
          computer.executors.forEach(function (executor) {
            data[computer.displayName].push({
              idle: executor.idle,
              progress: executor.progress,
              name: (!executor.idle) ?
                executor.currentExecutable.url.replace(/.*\/job\//, '').
                replace(/\/.*TOREMOVE/, '') : ''
            });
          });
        });
        return data;
      }
    }, cb));
  }

  // display job status and reports
  function job(_job, cb) {
    comm.http('/job/' + _job + '/api/json', 'GET', url, _cb({
      404: function (result) {
        throw new Error('Job does not exist');
      },
      'ok': function (result) {
        var json = JSON.parse(result.data), data = {};
        data.status = status[json.color];
        data.reports = [];
        json.healthReport.forEach(function (report) {
          data.reports.push(report.description);
        });
        return data;
      }
    }, cb));    
  }

  // list all queued jobs
  function queue(cb) {
    comm.http('/queue/api/json', 'GET', url, _cb({
      'ok': function (result) {
        var items = JSON.parse(result.data).items, data = [];
        if (items && items.length > 0) {
          items.forEach(function (item) {
              data.push(item.task.name);
          });
        }
        return data;
      }
    }, cb));
  }

  // display Jenkins version
  function version(cb) {
    comm.http('/', 'HEAD', url, _cb({
      'ok': function (result) {
        if (result.headers['x-jenkins']) {
          return result.headers['x-jenkins'];
        } else {
          throw new Error('Not a Jenkins server');
        }
      }
    }, cb));
  }

  return {
    build: build,
    dashboard: dashboard,
    discover: discover,
    executor: executor,
    job: job,
    queue: queue,
    version: version
  };
}

exports.Jenkins = Jenkins;
*/