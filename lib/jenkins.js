var _ = require('lodash'),
  async = require('async'),
  commander = require('commander'),
  ConsoleStream = require('./consolestream'),
  cron = require('cron'),
  dgram = require('dgram'),
  feedparser = require('feedparser'),
  fs = require('fs'),
  p = require('path'),
  req = require('bagofrequest'),
  request = require('request'),
  text = require('bagoftext'),
  xml2js = require('xml2js'),
  moment = require('moment');

var jenkins = require('./http/jenkins');
var job     = require('./http/job');
var view    = require('./http/view');

text.initLocales(__dirname);

/**
 * class Jenkins
 *
 * @param {String} url: Jenkins URL, fallback to JENKINS_URL environment variable, otherwise default to http://localhost:8080
 */
function Jenkins(url) {

  function _authFail(result, cb) {
    cb(new Error(text.__('Authentication failed - incorrect username and/or password in Jenkins URL')));
  }

  function _authRequire(result, cb) {
    cb(new Error(text.__('Jenkins requires authentication - set username and password in Jenkins URL')));
  }

  this.url = url || process.env.JENKINS_URL || 'http://localhost:8080';
  this.opts = {
    handlers: {
      401: _authFail,
      403: _authRequire
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
    method = 'post';

  if (params) {
    params.split('&').forEach(function (param) {
      var keyVal = param.split('=');
      json.parameter.push({ name: keyVal[0], value: keyVal[1] });
    });
  }
  this.opts.queryStrings = { token: 'nestor', json: JSON.stringify(json) };

  function _success(result, cb) {
    cb();
  }

  function _notFound(result, cb) {
    cb(new Error(text.__('Job %s does not exist', jobName)));
  }

  function _paramsRequire(result, cb) {
    cb(new Error(text.__('Job %s requires build parameters', jobName)));
  }

  this.opts.handlers[200] = _success; // backward compatibility (< v1.5xx)
  this.opts.handlers[201] = _success;
  this.opts.handlers[404] = _notFound;
  this.opts.handlers[405] = _paramsRequire; // backward compatibility (< v1.5xx)

  req.request(method, this.url + '/job/' + jobName + '/build', this.opts, cb);
};

/**
 * Trigger multiple jobs based on criteria.
 *
 * @param {Object} criteria: job criteria to build
 *   - status: build status
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.filteredBuild = function (criteria, cb) {
  criteria = criteria || {};
  var self = this;

  function filter(item) {
    return Object.keys(criteria).length > 0 ?
        item.status === criteria.status :
        true;
  }

  function iterator(item, cb) {
    self.build(item.name, null, function (err, result) {
      if (!err) {
        console.log(text.__('Job %s was started successfully'), item.name);
      }
      cb(err);
    });
  }

  function dashboardCb(err, data) {
    if (!err) {
      async.each(data.filter(filter), iterator, cb);
    } else {
      cb(err);
    }
  }
  this.dashboard(dashboardCb);
};

/**
 * Read a Jenkins job console output as a readable stream.
 * Jenkins uses the following headers:
 * - x-more-data to determine whether there are still more content coming through
 * - x-text-size to determine the starting point of progressive text output
 *
 * @param {String} jobName: Jenkins job name
 * @param {Object} opts: optional interval in milliseconds
 * @param {Function} cb: standard cb(err, result) callback
 * @return {ConsoleStream} readable console output stream
 */
Jenkins.prototype.consoleStream = function(jobName, opts, cb) {
  if (!cb && typeof opts === 'function') {
    cb = opts;
    opts = undefined;
  }

  const INTERVAL = 1000;
  var url = this.url + '/job/' + jobName + '/lastBuild/logText/progressiveText',
    stream = new ConsoleStream(),
    self = this;

  this.opts.queryStrings = { start: 0 }; // the first chunk

  function _success(result, cb) {
    if (result.body) {
      stream.emit('data', result.body);
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
          },
          envProxy = req.proxy(url);
        if (envProxy) {
          params.proxy = envProxy;
        }
        request.get(params, function (err, _result) {
          if (err) {
            cb(err);
          } else {
            result = _result;
            if (_result.body) {
              stream.emit('data', _result.body);
            }
            setTimeout(cb, (opts && opts.interval) ? opts.interval : INTERVAL);
          }
        });
      },
      function (err) {
        stream.emit('end');
        cb(err);
      }
    );
  }

  function _notFound(result, cb) {
    cb(new Error(text.__('Job %s does not exist', jobName)));
  }

  this.opts.handlers[200] = _success;
  this.opts.handlers[404] = _notFound;

  process.nextTick(function () {
    req.request('get', url, self.opts, cb);
  });

  return stream;
};

/**
 * Display build progress console output.
 *
 * @param {String} jobName: Jenkins job name
 * @param {Object} opts: optional interval in milliseconds
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.console = function (jobName, opts, cb) {
  var stream = this.consoleStream(jobName, opts, cb);
  stream.pipe(process.stdout, { end: false });
};

/**
 * Retrieve all jobs as displayed on Jenkins dashboard.
 * Result is an array containing objects with status and name properties
 * If viewName option is specified, then use the view jobs.
 * Otherwise defaults to all jobs.
 *
 * @param {Object} opts: optional
 * - viewName: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.dashboard = function (opts, cb) {
  // backward compatibility v0.1.9 and older
  if (!cb) {
    cb = opts;
    opts = {};
  }

  var self = this,
    url = this.url + ((opts.viewName) ? '/view/' + opts.viewName: '') + '/api/json';

  function _success(result, cb) {
    var jobs = JSON.parse(result.body).jobs,
      data = [];
    if (!_.isEmpty(jobs)) {
      jobs.forEach(function (job) {
        data.push({ status: self._statusByColor(job.color), name: job.name });
      });
    }
    cb(null, data);    
  }

  this.opts.handlers[200] = _success;

  req.request('get', url, this.opts, cb);
};

/**
 * Discover whether there's a Jenkins instance running on the specified host.
 *
 * @param {String} host: hostname
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.discover = function (host, cb) {

  const TIMEOUT = 5000;

  var socket = dgram.createSocket('udp4'),
    buffer = new Buffer(text.__('Long live Jenkins!')),
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
  
  setTimeout(function () {
    cb(new Error(text.__('Unable to find any Jenkins instance on %s', host)));
  }, TIMEOUT);
};

/**
 * Retrieve executors status grouped by Jenkins node (master and all slaves).
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.executor = function (cb) {

  this.opts.queryStrings = { depth: 1 };

  function _success(result, cb) {
    var computers = JSON.parse(result.body).computer,
      data = {};
    computers.forEach(function (computer) {
      data[computer.displayName] = { executors: [] };
      var idleCount = 0,
        activeCount = 0;
      computer.executors.forEach(function (executor) {
        data[computer.displayName].executors.push({
          idle: executor.idle,
          stuck: executor.likelyStuck,
          progress: executor.progress,
          name: (!executor.idle) ?
            executor.currentExecutable.url.replace(/.*\/job\//, '').replace(/\/.*/, '') :
            undefined
        });
        if (executor.idle) {
          idleCount += 1;
        } else {
          activeCount += 1;
        }
      });
      var summary = [];
      if (activeCount > 0) {
        summary.push(text.__('%d active', activeCount)); 
      }
      if (idleCount > 0) {
        summary.push(text.__('%d idle', idleCount));
      }
      data[computer.displayName].summary = summary.join(', ');
    });
    cb(null, data);
  }

  this.opts.handlers[200] = _success;

  req.request('get', this.url + '/computer/api/json', this.opts, cb);
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

  function _success(result, cb) {
    var _job = JSON.parse(result.body),
      data = {};
    data.status = self._statusByColor(_job.color);
    data.reports = [];
    _job.healthReport.forEach(function (report) {
      data.reports.push(report.description);
    });
    cb(null, data);
  }

  function _notFound(result, cb) {
    cb(new Error(text.__('Job %s does not exist', name)));
  }

  this.opts.handlers[200] = _success;
  this.opts.handlers[404] = _notFound;

  req.request('get', this.url + '/job/' + name + '/api/json', this.opts, cb);
};

/**
 * Retrieve status and date for the most recently completed build.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.last = function (name, cb) {

    function _success(result, cb) {
        var _build = JSON.parse(result.body),
            buildMoment,
            data = {
                building: _build.building,
                result: _build.result
            };

        if (_build.building > 0) {
            buildMoment = moment(_build.timestamp);
            data.buildDateDistance = "Started " + buildMoment.fromNow();

        } else {
            buildMoment = moment(_build.timestamp + _build.duration);
            data.buildDateDistance = "Ended " + buildMoment.fromNow();
        }

        data.buildDate = buildMoment.toISOString();

        cb(null, data);
    }

    function _notFound(result, cb) {
        cb(new Error(text.__('No build could be found for job %s', name)));
    }

    this.opts.handlers[200] = _success;
    this.opts.handlers[404] = _notFound;

    req.request('get', this.url + '/job/' + name + '/lastBuild/api/json', this.opts, cb);
};

Jenkins.prototype.readQueue       = jenkins.readQueue;
Jenkins.prototype.version         = jenkins.readVersion;

Jenkins.prototype.createJob       = job.create;
Jenkins.prototype.readJob         = job.read;
Jenkins.prototype.updateJob       = job.update;
Jenkins.prototype.deleteJob       = job.delete;
//Jenkins.prototype.buildJob        = job.build;
Jenkins.prototype.stopJob         = job.stop;
Jenkins.prototype.enableJob       = job.enable;
Jenkins.prototype.disableJob      = job.disable;
Jenkins.prototype.copyJob         = job.copy;
Jenkins.prototype.fetchJobConfig  = job.fetchConfig;

Jenkins.prototype.createView      = view.create;
Jenkins.prototype.updateView      = view.update;
Jenkins.prototype.fetchViewConfig = view.fetchConfig;

/**
 * Retrieve jobs in the queue waiting for available executor or
 * for a previously running build of the same job to finish.
 *
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.queue = function (cb) {

  function _success(result, cb) {
    var items = JSON.parse(result.body).items,
      data = [];
    if (!_.isEmpty(items)) {
      items.forEach(function (item) {
          data.push(item.task.name);
      });
    }
    cb(null, data);
  }

  this.opts.handlers[200] = _success;

  req.request('get', this.url + '/queue/api/json', this.opts, cb);
};

/**
 * Retrieve Jenkins feed or job feed.
 * If jobName option is specified, then use the job feed.
 * If viewName option is specified, then use the view feed.
 * Otherwise defaults to all feed.
 *
 * @param {Object} opts: optional
 * - jobName: Jenkins job name
 * - viewName: Jenkins view name
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.feed = function (opts, cb) {
  opts = opts || {};
  var url;
  if (opts.jobName) {
    url = this.url + '/job/' + opts.jobName + '/rssAll';
  } else if (opts.viewName) {
    url = this.url + '/view/' + opts.viewName + '/rssAll';
  } else {
    url = this.url + '/rssAll';
  }
  feedparser.parseUrl(url, function (err, meta, articles) {
    cb(err, articles);
  });
};

/**
 * Monitor Jenkins latest build status on a set interval.
 *
 * @param {Object} opts: optional
 * - jobName: Jenkins job name
 * - viewName: Jenkins view name
 * - schedule: cron scheduling definition in standard * * * * * * format, default: 0 * * * * * (every minute)
 * @param {Function} cb: standard cb(err, result) callback
 */
Jenkins.prototype.monitor = function (opts, cb) {
  var self = this;

  function _notify() {
    self.dashboard(opts, function (err, result) {
      if (!err) {
        result = self._statusByName({ jobName: opts.jobName }, result);
      }
      cb(err, result);
    });
  }

  _notify();
  new cron.CronJob(opts.schedule || '0 * * * * *', _notify).start();
};

Jenkins.prototype._statusByColor = function (color) {

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

Jenkins.prototype._statusByName = function (opts, data) {
  const STATUS = ['FAIL', 'WARN', 'ABORTED', 'OK'];

  if (opts.jobName) {
    data = data.filter(function (item) {
      return item.name === opts.jobName;
    });
  }

  var uniq = _.uniq(_.pluck(data, 'status')),
    status = null;
  
  STATUS.some(function (item) {
    if (uniq.indexOf(item) !== -1) {
      status = item;
      return true;
    }
  });

  return status;
};

module.exports = Jenkins;
