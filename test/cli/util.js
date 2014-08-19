var buster  = require('buster-node');
var referee = require('referee');
var text    = require('bagoftext');
var util    = require('../../lib/cli/util');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('cli - util - statusByColor', {
  'should show the correct status for all supported colors': function () {
    assert.equals(util.statusByColor('blue'), 'ok');
    assert.equals(util.statusByColor('green'), 'ok');
    assert.equals(util.statusByColor('grey'), 'aborted');
    assert.equals(util.statusByColor('red'), 'fail');
    assert.equals(util.statusByColor('yellow'), 'warn');
  },
  'should show the correct status for actively running build': function () {
    assert.equals(util.statusByColor('blue_anime'), 'ok');
    assert.equals(util.statusByColor('green_anime'), 'ok');
    assert.equals(util.statusByColor('grey_anime'), 'aborted');
    assert.equals(util.statusByColor('red_anime'), 'fail');
    assert.equals(util.statusByColor('yellow_anime'), 'warn');
  },
  'should return value as-is when status is a real status value': function () {
    assert.equals(util.statusByColor('notbuilt'), 'notbuilt');
  }
});