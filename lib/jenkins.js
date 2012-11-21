var _ = require('underscore'),
  async = require('async'),
  dgram = require('dgram'),
  request = require('request'),
  xml2js = require('xml2js');

/**
 * Sends a HTTP request to a Jenkins URL and handle the following errors:
 * - request error
 * - authentication error
 * - unexpected status error
 *
 * @param {String} method: http method
 * @param {String} url: Jenkins URL without query string
 * @param {String} proxy: proxy server URL in format http://user:pass@host:port
 * @param {Object} qs: object containing URL query strings with format { name: value }
 * @param {Object} handlers: response handlers with format { statuscode: handlerfunction }
 * @param {Function} cb: standard cb(err, result) callback
 */
function _http(method, url, proxy, queryStrings, handlers, cb) {

  var params = {
    method: method,
    uri: url,
    qs: queryStrings
  };

  if (proxy) {
    params.proxy = proxy;
  }

  request(params, function (err, result) {
    if (err) {
      cb(err);
    } else if (result.statusCode === 401) {
      cb(new Error('Authentication failed - incorrect username and/or password in JENKINS_URL'));
    } else if (result.statusCode === 403) {
      cb(new Error('Jenkins requires authentication - set username and password in JENKINS_URL'));
    } else if (handlers[result.statusCode]) {
      handlers[result.statusCode](result);
    } else {
      cb(new Error('Unexpected status code ' + result.statusCode + ' from Jenkins\nResponse body:\n' + result.body));
    }
  });  
}

/**
 * Send UDP message to a Jenkins instance.
 *
 * @param {String} message: message to be sent to Jenkins
 * @param {String} host: Jenkins host name
 * @param {String} port: Jenkins port number
 * @param {Function} cb: standard cb(err, result) callback
 */
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

/**
 * Convert a color into a status.
 * Jenkins returns a mix of color, color_anime, and status in job.color field.
 *
 * @param {String} color: job color
 * @return {String} status representation of the color
 */
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
 *
 * @param {String} url: Jenkins URL
 * @param {String} proxy: proxy server URL in format http://user:pass@host:port
 */
function Jenkins (url, proxy) {
  this.url = url || 'http://localhost:8080';
  this.proxy = proxy;
}

/**
 * Build job with optional parameters.
 *
 * @param {String} jobName: Jenkins job name
 * @param {String} params: build parameter (for Jenkins parameterised build) in format: key1=value1&key2=value2
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.build = function (jobName, params, cb) {

  function _success(result) {
    cb(null);
  }

  function _notFound(result) {
    cb(new Error('Job ' + jobName + ' does not exist'));
  }

  function _notAllowed(result) {
    cb(new Error('Job ' + jobName + ' requires build parameters'));
  }

  var json = { parameter: [] },
    method = 'get';

  if (params) {
    params.split('&').forEach(function (param) {
      var keyVal = param.split('=');
      json.parameter.push({ name: keyVal[0], value: keyVal[1] });
    });
    method = 'post';
  }

  _http(method, this.url + '/job/' + jobName + '/build', this.proxy, { token: 'nestor', json: JSON.stringify(json) }, { 200: _success, 404: _notFound, 405: _notAllowed }, cb);
};

/**
 * Display build progress console output.
 * Jenkins uses the following headers:
 * - x-more-data to determine whether there are still more content coming through
 * - x-text-size to determine the starting point of progressive text output
 * Uses process.stdout.write instead of console.log because console.log adds an empty line.
 *
 * @param {String} jobName: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.console = function (jobName, cb) {

  var url = this.url + '/job/' + jobName + '/lastBuild/logText/progressiveText',
    method = 'get',
    start = 0,
    self = this;

  function _success(result) {
    process.stdout.write(result.body);

    async.whilst(
      function () {
        return result.headers['x-more-data'] === 'true';
      },
      function (cb) {
        var params = {
          method: method,
          uri: url,
          qs: { start: start + parseInt(result.headers['x-text-size'], 10) }
        };
        if (self.proxy) {
          params.proxy = self.proxy;
        }
        start = params.qs.start;
        request(params, function (err, _result) {
          if (err) {
            cb(err);
          } else {
            result = _result;
            if (_result.body) {
              process.stdout.write(_result.body);
            }
            setTimeout(function () {
              cb();
            }, 1000);
          }
        });
      },
      function (err) {
        cb(err);
      }
    );
  }

  function _notFound(result) {
    cb(new Error('Job ' + jobName + ' does not exist'));
  }

  _http(method, url, this.proxy, { start: start }, { 200: _success, 404: _notFound }, cb);
};

/**
 * Retrieve all jobs as displayed on Jenkins dashboard.
 * Result is an array containing objects with status and name properties.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
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

  _http('get', this.url + '/api/json', this.proxy, {}, { 200: _success }, cb);
};

/**
 * Discover whether there's a Jenkins instance running on the specified host.
 *
 * @param {String} host: hostname
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.discover = function (host, cb) {
  _udp('Long live Jenkins!', host, 33848, cb);
};

/**
 * Retrieve executors status grouped by Jenkins node (master and all slaves).
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
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

  _http('get', this.url + '/computer/api/json', this.proxy, { depth: 1 }, { 200: _success }, cb);
};

/**
 * Retrieve job status and health reports.
 * An error will be passed when the job does not exist.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
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

  _http('get', this.url + '/job/' + name + '/api/json', this.proxy, {}, { 200: _success, 404: _notFound }, cb);
};

/**
 * Retrieve jobs in the queue waiting for available executor or
 * for a previously running build of the same job to finish.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
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

  _http('get', this.url + '/queue/api/json', this.proxy, {}, { 200: _success }, cb);
};

/**
 * Retrieve Jenkins version number from x-jenkins header.
 * If x-jenkins header does not exist, then it's assumed that the server is not a Jenkins instance.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.version = function (cb) {

  function _success(result) {
    if (result.headers['x-jenkins']) {
      cb(null, result.headers['x-jenkins']);
    } else {
      cb(new Error('Not a Jenkins server'));
    }
  }

  _http('head', this.url, this.proxy, {}, { 200: _success }, cb);
};

module.exports = Jenkins;
