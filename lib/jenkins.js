var _ = require('underscore'),
  dgram = require('dgram'),
  request = require('request'),
  xml2js = require('xml2js');

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
 * Jenkins#build(jobName, params, cb)
 * - jobName (String): Jenkins job name
 * - params (String): build parameter (for Jenkins parameterised build) in format: key1=value1&key2=value2
 * - cb (Function): standard cb(err, result) callback
 *
 * Build job with optional parameters.
 **/
Jenkins.prototype.build = function (jobName, params, cb) {

  function _success(result) {
    cb(null);
  }

  function _notFound(result) {
    cb(new Error('Job ' + jobName + ' does not exist'));
  }

  var json = { parameter: [] };
  if (params) {
    params.split('&').forEach(function (param) {
      var keyVal = param.split('=');
      json.parameter.push({ name: keyVal[0], value: keyVal[1] });
    });
  }

  _http('get', this.url + '/job/' + jobName + '/build?token=nestor&json=' + JSON.stringify(json), { 200: _success, 404: _notFound }, cb);
};

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
 * Jenkins#executor(cb)
 * - cb (Function): standard cb(err, result) callback
 *
 * Retrieve executors status grouped by Jenkins node (master and all slaves).
 **/
Jenkins.prototype.executor = function (cb) {

  function _success(result) {
    var computers = JSON.parse(result.body).computer,
      data = {};

    computers.forEach(function (computer) {
      data[computer.displayName] = [];
      computer.executors.forEach(function (executor) {
        data[computer.displayName].push({
          idle: executor.idle,
          stuck: executor.likelyStuck,
          progress: executor.progress,
          name: (!executor.idle) ?
            executor.currentExecutable.url.replace(/.*\/job\//, '').replace(/\/.*/, '') :
            undefined
        });
      });
    });
    cb(null, data);
  }

  _http('get', this.url + '/computer/api/json?depth=1', { 200: _success }, cb);
};

/**
 * Jenkins#build(name, cb)
 * - name (String): Jenkins job name
 * - cb (Function): standard cb(err, result) callback
 *
 * Retrieve job status and health reports.
 * An error will be passed when the job does not exist.
 **/
Jenkins.prototype.job = function (name, cb) {

  function _success(result) {
    var _job = JSON.parse(result.body),
      data = {};
    data.status = _status(_job.color);
    data.reports = [];
    _job.healthReport.forEach(function (report) {
      data.reports.push(report.description);
    });

    cb(null, data);
  }

  function _notFound(result) {
    cb(new Error('Job ' + name + ' does not exist'));
  }

  _http('get', this.url + '/job/' + name + '/api/json', { 200: _success, 404: _notFound }, cb);
};

/**
 * Jenkins#queue(cb)
 * - cb (Function): standard cb(err, result) callback
 *
 * Retrieve jobs in the queue waiting for available executor or
 * for a previously running build of the same job to finish.
 **/
Jenkins.prototype.queue = function (cb) {

  function _success(result) {
    var items = JSON.parse(result.body).items,
      data = [];

    if (!_.isEmpty(items)) {
      items.forEach(function (item) {
          data.push(item.task.name);
      });
    }
    cb(null, data);
  }

  _http('get', this.url + '/queue/api/json', { 200: _success }, cb);
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