"use strict";

/**
 * Handle success simply by passing the entire response through to callback
 *
 * @param {Object} result: result of the sent request as a string
 * @param {Function} cb: standard cb(err, result) callback
 */
function passThroughResponse(result, cb) {
  cb(null, result);
}

/**
 * Handle success simply by passing result's (response) body through to callback.
 *
 * @param {Object} result: result of the sent request as a string
 * @param {Function} cb: standard cb(err, result) callback
 */
function passThroughSuccess(result, cb) {
  cb(null, result.body);
}

/**
 * Handle success simply by passing result's (response) JSON string body parsed as an object through to callback.
 *
 * @param {Object} result: result of the sent request as object
 * @param {Function} cb: standard cb(err, result) callback
 */
function passThroughSuccessJson(result, cb) {
  cb(null, JSON.parse(result.body));
}

/**
 * Parse HTML error page from Jenkins, pass the error message to the callback.
 * This error is usually the response body of error 400.
 *
 * @param {Object} result: result of the sent request
 * @param {Function} cb: standard cb(err, result) callback
 */
function htmlError(result, cb) {
  const message = result.body
    .match(/<h1>Error<\/h1>.+<\/p>/).toString()
    .replace(/<h1>Error<\/h1>/, '')
    .replace(/<\/?p>/g, '');
  cb(new Error(message));
}

/**
 * Create a 'job not found' error handler function.
 *
 * @param {String} name: the job name
 * @return a handler function
 */
function jobNotFoundError(name) {
  return function (result, cb) {
    cb(new Error(`Job ${name} does not exist`));
  };
}

/**
 * Create a 'job or build not found' error handler function.
 *
 * @param {String} name: the job name
 * @param {Number} buildNumber: the job's build number
 * @return a handler function
 */
function jobBuildNotFoundError(name, buildNumber) {
  return function (result, cb) {
    cb(new Error(`Job ${name} build ${buildNumber} does not exist`));
  };
}

/**
 * Create a 'job require params' error handler function.
 *
 * @param {String} name: the job name
 * @return a handler function
 */
function jobRequireParamsError(name) {
  return function (result, cb) {
    cb(new Error(`Job ${name} requires build parameters`));
  };
}

/**
 * Create a 'view not found' error handler function.
 *
 * @param {String} name: the view name
 * @return a handler function
 */
function viewNotFoundError(name) {
  return function (result, cb) {
    cb(new Error(`View ${name} does not exist`));
  };
}

const exports = {
  passThroughResponse: passThroughResponse,
  passThroughSuccess: passThroughSuccess,
  passThroughSuccessJson: passThroughSuccessJson,
  htmlError: htmlError,
  jobNotFoundError: jobNotFoundError,
  jobBuildNotFoundError: jobBuildNotFoundError,
  jobRequireParamsError: jobRequireParamsError,
  viewNotFoundError: viewNotFoundError
};

export {
  exports as default
};