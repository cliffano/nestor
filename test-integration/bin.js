var buster = require('buster');
require('shelljs/global');

buster.testCase('bin', {
  setUp: function () {
    // assume Jenkins is already up and running on http://localhost:8080
  },
  tearDown: function () {
  },
  'build - should exit with code 1 when job does not exist': function () {
    var result = exec('nestor build somenonexistingbuild');
    assert.equals(result.code, 1);
    assert.equals(result.output, 'Job somenonexistingbuild does not exist\n');
  },
  'console - should exit with code 1 when job does not exist': function () {
    var result = exec('nestor console somenonexistingbuild');
    assert.equals(result.code, 1);
    assert.equals(result.output, 'Job somenonexistingbuild does not exist\n');
  },
  'stop - should exit with code 1 when job does not exist': function () {
    var result = exec('nestor stop somenonexistingbuild');
    assert.equals(result.code, 1);
    assert.equals(result.output, 'Job somenonexistingbuild does not exist\n');
  },
  'dashboard - should exit with code 0 because dashboard list always exists': function () {
    var result = exec('nestor dashboard');
    assert.equals(result.code, 0);
    assert.isTrue(result.output.length > 0);
  },
  'discover - should exit with code 0 because it discovers the Jenkins instance used for integration testing': function () {
    var result = exec('nestor discover');
    assert.equals(result.code, 0);
    assert.isTrue(result.output.length > 0);
  },
  'executor - should exit with code 0 because executor list always exists': function () {
    var result = exec('nestor executor');
    assert.equals(result.code, 0);
    assert.isTrue(result.output.length > 0);
  },
  'job - should exit with code 1 when job does not exist': function () {
    var result = exec('nestor job somenonexistingbuild');
    assert.equals(result.code, 1);
    assert.equals(result.output, 'Job somenonexistingbuild does not exist\n');
  },
  'queue - should exit with code 0 because queue list always exists': function () {
    var result = exec('nestor queue');
    assert.equals(result.code, 0);
    assert.isTrue(result.output.length > 0);
  },
  'ver - should exit with code 0 because it should return the version of Jenkins instance used for integration testing': function () {
    var result = exec('nestor ver');
    assert.equals(result.code, 0);
    assert.isTrue(result.output.length > 0);
  }
});