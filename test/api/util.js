"use strict";
/* eslint no-unused-vars: 0 */
import util from '../../lib/api/util.js';
import referee from '@sinonjs/referee';
const assert = referee.assert;

describe('api - util', function() {
  it('passThroughResponse - should pass entire response', function (done) {
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result, 'someresponse');
      done();
    }
    util.passThroughResponse('someresponse', cb);
  });
  it('passThroughSuccess - should pass result body', function (done) {
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result, 'somebody');
      done();
    }
    util.passThroughSuccess({ body: 'somebody' }, cb);
  });
  it('passThroughSuccessJson - should pass result JSON body as an object', function (done) {
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result.foo, 'bar');
      done();
    }
    util.passThroughSuccessJson({ body: '{ "foo": "bar" }' }, cb);
  });
  it('htmlError - should pass error with message parsed from Jenkins HTML error page', function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'Some Error');
      assert.isUndefined(result);
      done();
    }
    util.htmlError({ body: '<h1>Error</h1><p>Some Error</p>' }, cb);
  });
  it('jobNotFoundError - should pass job does not exist error message', function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'Job somejob does not exist');
      assert.isUndefined(result);
      done();
    }
    util.jobNotFoundError('somejob')(null, cb);
  });
  it('jobBuildNotFoundError - should pass job build does not exist error message', function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'Job somejob build 123 does not exist');
      assert.isUndefined(result);
      done();
    }
    util.jobBuildNotFoundError('somejob', 123)(null, cb);
  });
  it('jobRequireParamsError - should pass job require params error message', function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'Job somejob requires build parameters');
      assert.isUndefined(result);
      done();
    }
    util.jobRequireParamsError('somejob')(null, cb);
  });
  it('viewNotFoundError - should pass view does not exist error message', function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'View someview does not exist');
      assert.isUndefined(result);
      done();
    }
    util.viewNotFoundError('someview')(null, cb);
  });
});
