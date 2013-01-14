var buster = require('buster');
require('shelljs/global');

buster.testCase('bin - build', {
  'should exit with code 1 when job does not exist': function () {
    var result = exec('nestor build somenonexistingbuild');
    assert.equals(result.code, 1);
    assert.equals(result.output, 'Job somenonexistingbuild does not exist\n');
  }
});

buster.testCase('bin - dashboard', {
  'should exit with code 0 because dashboard must always exist': function () {
    var result = exec('nestor dashboard');
    assert.equals(result.code, 0);
    assert.isTrue(result.output.length > 0);
  }
});