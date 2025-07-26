"use strict";
import _ from 'lodash';
import async from 'async';
import ConsoleStream from './consolestream.js';
import RssParser from 'rss-parser';

/**
 * Create a job with specified configuration.
 *
 * @param {String} name: Jenkins job name
 * @param {String} config: Jenkins job config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function create(name, config, cb) {
  const opts = {
    body: config,
    contentType: 'application/xml',
  };
  this.remoteAccessApi.postCreateItem(name, _.merge(opts, this.opts.headers), cb);
}

/**
 * Retrieve information about a job.
 * Information contains job status and reports among other things.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function read(name, cb) {
  this.remoteAccessApi.getJob(name, cb);
}

/**
 * Retrieve information about the latest build of a job.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function readLatest(name, cb) {
  this.remoteAccessApi.getJobLastBuild(name, cb);
}

/**
 * Update a job with specified configuration
 *
 * @param {String} name: Jenkins job name
 * @param {String} config: Jenkins job config.xml
 * @param {Function} cb: standard cb(err, result) callback
 */
function update(name, config, cb) {
  this.remoteAccessApi.postJobConfig(name, config, this.opts.headers, cb);
}

/**
 * Delete a job.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function _delete(name, cb) {
  this.remoteAccessApi.postJobDelete(name, this.opts.headers, cb);
}

/**
 * Build a job.
 *
 * @param {String} name: Jenkins job name
 * @param {Object|String} params: build parameters key-value pairs, passed as object or 'a=b&c=d' string
 * @param {Function} cb: standard cb(err, result) callback
 */
function build(name, params, cb) {
  const body = { parameter: [] } ;
  _.keys(params).forEach(function (key) {
    body.parameter.push({ name: key, value: params[key] });
  });
  const opts = {
    token: 'nestor'
  };
  this.remoteAccessApi.postJobBuild(name, JSON.stringify(body), _.merge(opts, this.opts.headers), cb);
}

function checkStarted(buildUrl, cb) {
  // hudson.model.Queue$WaitingItem indicates that the item is still waiting in the queue
  // hudson.model.Queue$LeftItem indicates that the item left the queue and the build has started
  function _cb(err, result) {
    if (result && result._class === 'hudson.model.Queue$LeftItem') {
      cb(true);
    } else {
      cb(false);
    }
  }
  // extracts queue item number from the URL
  // e.g. http://localhost:8080/queue/item/12/ , the queue item number is 12
  function parseQueueItemNumber(buildUrl) {
    const elems = buildUrl.split('/');
    return elems[elems.length - 2];
  }
  this.remoteAccessApi.getQueueItem(parseQueueItemNumber(buildUrl), _cb);
}

/**
 * Stop a running/building job.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function stop(name, cb) {
  this.remoteAccessApi.postJobLastBuildStop(name, this.opts.headers, cb);
}

/**
 * Stream a Jenkins job console output (readable stream).
 * Jenkins uses the following headers:
 * - x-more-data to determine whether there are still more content coming through
 * - x-text-size to determine the starting point of progressive text output (this was obviously badly named, but stayed there for backward compatibility reason)
 *
 * @param {String} name: Jenkins job name
 * @param {Number} buildNumber: Jenkins job's build number
 * @param {Number} interval: interval between console requests in milliseconds
 * @param {Function} cb: standard cb(err, result) callback
 * @return {ConsoleStream} readable console output stream
 */
function streamConsole(name, buildNumber, interval, cb) {

  buildNumber = buildNumber || 'lastBuild';

  const stream = new ConsoleStream();
  const self   = this;

  function _processMoreChunks(result, response, cb) {
    if (response.text) {
      stream.emit('data', response.text);
    }
    // stream while there are more data
    async.whilst(
      function (cb) {
        cb(null, response.headers['x-more-data'] === 'true');
      },
      function (cb) {
        function _moreChunkCb(err, _result, _response) {
          response = _response;
          if (_response.text) {
            stream.emit('data', _response.text);
          }
          setTimeout(cb, interval);
        }
        const start = parseInt(response.headers['x-text-size'], 10);
        self.remoteAccessApi.getJobProgressiveText(name, buildNumber, start, _moreChunkCb);
      },
      function (err) {
        stream.emit('end');
        cb(err);
      }
    );
  }

  process.nextTick(function () {
    // start with value 0 indicates the first chunk of the console output
    const start = 0;
    function _firstChunkCb(err, result, response) {
      if (!err && response.statusCode === 200) {
        _processMoreChunks(result, response, cb);
      } else {
        cb(err, result);
      }
    }
    self.remoteAccessApi.getJobProgressiveText(name, buildNumber, start, _firstChunkCb);
  });

  return stream;
}

/**
 * Enable a job.
 * If job was disabled, then it will be enabled.
 * If job was already enabled, then it will stay as-is, no error.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function enable(name, cb) {
  this.remoteAccessApi.postJobEnable(name, this.opts.headers, cb);
}

/**
 * Disable a job.
 * If job was enabled, then it will be disabled.
 * If job was already disabled, then it will stay as-is, no error.
 *
 * @param {String} jobName: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function disable(name, cb) {
  this.remoteAccessApi.postJobDisable(name, this.opts.headers, cb);
}

/**
 * Copy an existing job into a new job.
 *
 * @param {String} existingName: existing Jenkins job name to copy from
 * @param {String} newName: new Jenkins job name to copy to
 * @param {Function} cb: standard cb(err, result) callback
 */
function copy(existingName, newName, cb) {
  const opts = {
    mode: 'copy',
    from: existingName,
    contentType: 'text/plain',
  };
  this.remoteAccessApi.postCreateItem(newName, _.merge(opts, this.opts.headers), cb);
}

/**
 * Fetch a job configuration.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function fetchConfig(name, cb) {
  this.remoteAccessApi.getJobConfig(name, cb);
}

/**
 * Parse job feed.
 *
 * @param {String} name: Jenkins job name
 * @param {Function} cb: standard cb(err, result) callback
 */
function parseFeed(name, cb) {
  const url = this.url + '/job/' + name + '/rssAll';
  new RssParser().parseURL(url, cb);
}

const exports = {
  create: create,
  read: read,
  readLatest: readLatest,
  update: update,
  delete: _delete,
  build: build,
  checkStarted: checkStarted,
  stop: stop,
  streamConsole: streamConsole,
  enable: enable,
  disable: disable,
  copy: copy,
  fetchConfig: fetchConfig,
  parseFeed: parseFeed
};

export {
  exports as default
};
