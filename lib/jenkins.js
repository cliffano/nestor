var _ = require('underscore'),
  dgram = require('dgram'),
  request = require('request'),
  xml2js = require('xml2js')

/** internal
 * jenkins#_http(method, url, handlers, cb)
 * - method (String):
 * - url (String): 
 * - handlers (Object):
 * - cb (Function): standard cb(err, result) callback
 *
 * Sends a HTTP request to a Jenkins URL and handle the following errors:
 * - request error
 * - authentication error
 * - unexpected status error
 **/
function _http(method, url, handlers, cb) {
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

/** internal
 * jenkins#udp(message, host, port, cb)
 * - message (String): message to be sent to Jenkins
 * - host (String): Jenkins host name
 * - port (String): Jenkins port number
 * - cb (Function): standard cb(err, result) callback
 *
 * Send UDP message to a Jenkins instance.
 **/
function _udp(message, host, port, cb) {

  var socket = dgram.createSocket('udp4'),
    buffer = new Buffer(message),
    parser = new xml2js.Parser();
  
  socket.on('error', function (err) {
    socket.close();
    cb(err);
  });

  socket.on('message', function (result) {
    socket.close();
    parser.addListener('end', function (result) {
      cb(null, result);
    });
    parser.parseString(result);
  });

  socket.send(buffer, 0, buffer.length, port, host, function (err, result) {
    if (err) {
      socket.close();
      cb(err);
    }
  });
}

/** internal
 * jenkins#_status(color) -> String
 * - color (String): job color
 *
 * Convert a color into a status.
 * Jenkins returns a mix of color, color_anime, and status in job.color field.
 **/
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

/**
 * class Jenkins
 * - url (String): Jenkins URL
 **/
function Jenkins (url) {
  this.url = url;
}

/**
 * Jenkins#dashboard(cb)
 * - cb (Function): standard cb(err, result) callback
 *
 * Retrieve all jobs as displayed on Jenkins dashboard.
 * Result is an array containing objects with status and name properties.
 **/
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

  _http('get', this.url + '/api/json', { 200: _success }, cb);
};

/**
 * Jenkins#discover(host, cb)
 * - host (String): hostname
 * - cb (Function): standard cb(err, result) callback
 *
 * Discover whether there's a Jenkins instance running on the specified host.
 **/
Jenkins.prototype.discover = function (host, cb) {
  _udp('Long live Jenkins!', host, 33848, cb);
};

/**
 * Jenkins#version(cb)
 * - cb (Function): standard cb(err, result) callback
 *
 * Retrieve Jenkins version number from x-jenkins header.
 * If x-jenkins header does not exist, then it's assumed that the server is not a Jenkins instance.
 **/
Jenkins.prototype.version = function (cb) {

  function _success(result) {
    if (result.headers['x-jenkins']) {
      cb(null, result.headers['x-jenkins']);
    } else {
      cb(new Error('Not a Jenkins server'));
    }
  }

  _http('head', this.url, { 200: _success }, cb);
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