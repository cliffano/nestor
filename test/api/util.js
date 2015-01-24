var buster  = require('buster-node');
var util    = require('../../lib/api/util');
var referee = require('referee');
var text    = require('bagoftext');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('api - util', {
  'passThroughSuccess - should pass result body': function (done) {
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result, 'somebody');
      done();
    }
    util.passThroughSuccess({ body: 'somebody' }, cb);
  },
  'passThroughSuccessJson - should pass result JSON body as an object': function (done) {
    function cb(err, result) {
      assert.isNull(err);
      assert.equals(result.foo, 'bar');
      done();
    }
    util.passThroughSuccessJson({ body: '{ "foo": "bar" }' }, cb);
  },
  'htmlError - should pass error with message parsed from Jenkins HTML error page': function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'Some Error');
      assert.equals(result, undefined);
      done();
    }
    util.htmlError({ body: '<h1>Error</h1><p>Some Error</p>' }, cb);
  },
  'jobNotFoundError - should pass job does not exist error message': function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'Job somejob does not exist');
      assert.equals(result, undefined);
      done();
    }
    util.jobNotFoundError('somejob')(null, cb);
  },
  'viewNotFoundError - should pass view does not exist error message': function (done) {
    function cb(err, result) {
      assert.equals(err.message, 'View someview does not exist');
      assert.equals(result, undefined);
      done();
    }
    util.viewNotFoundError('someview')(null, cb);
  }
});