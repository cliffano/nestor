/*jshint esnext: true */
var _ = require('underscore'),
  async = require('async'),
  bag = require('bagofholding'),
  dgram = require('dgram'),
  request = require('request'),
  xml2js = require('xml2js');

/**
 * class Jenkins
 *
 * @param {String} url: Jenkins URL, fallback to JENKINS_URL environment variable, otherwise default to http://localhost:8080
 * @param {Object} opts: optional
 * - proxy server URL in format http://user:pass@host:port
 */
function Jenkins(url, opts) {
  opts = opts || {};

  this.url = url || process.env.JENKINS_URL || 'http://localhost:8080';
  this.opts = {
    proxy: opts.proxy || process.env.http_proxy,
    handlers: {
      // authentication failed error handler
      401: function (result, cb) {
        cb(new Error('Authentication failed - incorrect username and/or password in JENKINS_URL'));
      },
      // authentication required error handler
      403: function (result, cb) {
        cb(new Error('Jenkins requires authentication - set username and password in JENKINS_URL'));
      }
    }
  };
}

/**
 * Build job with optional parameters.
 *
 * @param {String} jobName: Jenkins job name
 * @param {String} params: build parameter (for Jenkins parameterised build) in format: key1=value1&key2=value2
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.build = function (jobName, params, cb) {

  var json = { parameter: [] },
    method = 'get';

  if (params) {
    params.split('&').forEach(function (param) {
      var keyVal = param.split('=');
      json.parameter.push({ name: keyVal[0], value: keyVal[1] });
    });
    method = 'post';
  }
  this.opts.queryStrings = { token: 'nestor', json: JSON.stringify(json) };

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
    cb();
  };

  // not found error handler
  this.opts.handlers['404'] = function _notFound(result, cb) {
    cb(new Error('Job ' + jobName + ' does not exist'));
  };

  // parameters required error handler
  this.opts.handlers['405'] = function (result, cb) {
    cb(new Error('Job ' + jobName + ' requires build parameters'));
  };

  bag.http.request(method, this.url + '/job/' + jobName + '/build', this.opts, cb);
};

/**
 * Display build progress console output.
 * Jenkins uses the following headers:
 * - x-more-data to determine whether there are still more content coming through
 * - x-text-size to determine the starting point of progressive text output
 * Uses process.stdout.write instead of console.log because console.log adds an empty line.
 *
 * @param {String} jobName: Jenkins job name
 * @param {Object} opts: optional interval in milliseconds
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.console = function (jobName, opts, cb) {
  if (!cb) {
    cb = opts;
  }

  const INTERVAL = 1000;
  var url = this.url + '/job/' + jobName + '/lastBuild/logText/progressiveText',
    self = this;

  this.opts.queryStrings = { start: 0 }; // the first chunk

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
    if (result.body) {
      console.log(result.body);
    }
    // stream while there are more data
    async.whilst(
      function () {
        return result.headers['x-more-data'] === 'true';
      },
      function (cb) {
        var params = {
          url: url,
          qs: { start: parseInt(result.headers['x-text-size'], 10) }
        };
        if (self.opts.proxy) {
          params.proxy = self.opts.proxy;
        }
        request.get(params, function (err, _result) {
          if (err) {
            cb(err);
          } else {
            result = _result;
            if (_result.body) {
              console.log(_result.body);
            }
            setTimeout(function () {
              cb();
            }, opts.interval || INTERVAL);
          }
        });
      },
      function (err) {
        cb(err);
      }
    );
  };

  // not found error handler
  this.opts.handlers['404'] = function (result, cb) {
    cb(new Error('Job ' + jobName + ' does not exist'));
  };

  bag.http.request('get', url, this.opts, cb);
};

/**
 * Stop the currently running build.
 *
 * @param {String} jobName: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.stop = function (jobName, cb) {

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
    cb(null);
  };

  // not found error handler
  this.opts.handlers['404'] = function (result, cb) {
    cb(new Error('Job ' + jobName + ' does not exist'));
  };

  bag.http.request('get', this.url + '/job/' + jobName + '/lastBuild/stop', this.opts, cb);
};

/**
 * Retrieve all jobs as displayed on Jenkins dashboard.
 * Result is an array containing objects with status and name properties.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.dashboard = function (cb) {

  var self = this;

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
    var jobs = JSON.parse(result.body).jobs,
      data = [];
    if (!_.isEmpty(jobs)) {
      jobs.forEach(function (job) {
        data.push({ status: self._status(job.color), name: job.name });
      });
    }
    cb(null, data);    
  };

  bag.http.request('get', this.url + '/api/json', this.opts, cb);
};

/**
 * Discover whether there's a Jenkins instance running on the specified host.
 *
 * @param {String} host: hostname
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.discover = function (host, cb) {

  var socket = dgram.createSocket('udp4'),
    buffer = new Buffer('Long live Jenkins!'),
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

  socket.send(buffer, 0, buffer.length, 33848, host, function (err, result) {
    if (err) {
      socket.close();
      cb(err);
    }
  });
};

/**
 * Retrieve executors status grouped by Jenkins node (master and all slaves).
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.executor = function (cb) {

  this.opts.queryStrings = { depth: 1 };

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
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
  };

  bag.http.request('get', this.url + '/computer/api/json', this.opts, cb);
};

/**
 * Retrieve job status and health reports.
 * An error will be passed when the job does not exist.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.job = function (name, cb) {

  var self = this;

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
    var _job = JSON.parse(result.body),
      data = {};
    data.status = self._status(_job.color);
    data.reports = [];
    _job.healthReport.forEach(function (report) {
      data.reports.push(report.description);
    });
    cb(null, data);
  };

  // not found error handler
  this.opts.handlers['404'] = function (result, cb) {
    cb(new Error('Job ' + name + ' does not exist'));
  };

  bag.http.request('get', this.url + '/job/' + name + '/api/json', this.opts, cb);
};

/**
 * Retrieve jobs in the queue waiting for available executor or
 * for a previously running build of the same job to finish.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.queue = function (cb) {

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
    var items = JSON.parse(result.body).items,
      data = [];
    if (!_.isEmpty(items)) {
      items.forEach(function (item) {
          data.push(item.task.name);
      });
    }
    cb(null, data);
  };

  bag.http.request('get', this.url + '/queue/api/json', this.opts, cb);
};

/**
 * Retrieve Jenkins version number from x-jenkins header.
 * If x-jenkins header does not exist, then it's assumed that the server is not a Jenkins instance.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.version = function (cb) {

  // success handler
  this.opts.handlers['200'] = function (result, cb) {
    if (result.headers['x-jenkins']) {
      cb(null, result.headers['x-jenkins']);
    } else {
      cb(new Error('Not a Jenkins server'));
    }
  };

  bag.http.request('head', this.url, this.opts, cb);
};

Jenkins.prototype._status = function (color) {

  const STATUS = {  
    blue: 'OK',
    green: 'OK',
    grey: 'ABORTED',
    red: 'FAIL',
    yellow: 'WARN'
  };

  // Jenkins color value can contain either a color, color_anime, or status in job.color field,
  // hence to get color/status value out of the mix we need to remove the postfix _anime,
  // _anime postfix only exists on a job currently being built
  color = color.replace(/_anime/, '');

  return (STATUS[color]) || color.toUpperCase();
};

module.exports = Jenkins;
