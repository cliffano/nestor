var buster  = require('buster-node');
var referee = require('referee');
var text    = require('bagoftext');
var util    = require('../../lib/cli/util');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('util - statusByColor', {
  'should show the correct status for all supported colors': function () {
    assert.equals(util.statusByColor('blue'), 'OK');
    assert.equals(util.statusByColor('green'), 'OK');
    assert.equals(util.statusByColor('grey'), 'ABORTED');
    assert.equals(util.statusByColor('red'), 'FAIL');
    assert.equals(util.statusByColor('yellow'), 'WARN');
  },
  'should show the correct status for actively running build': function () {
    assert.equals(util.statusByColor('blue_anime'), 'OK');
    assert.equals(util.statusByColor('green_anime'), 'OK');
    assert.equals(util.statusByColor('grey_anime'), 'ABORTED');
    assert.equals(util.statusByColor('red_anime'), 'FAIL');
    assert.equals(util.statusByColor('yellow_anime'), 'WARN');
  },
  'should return undefined when status is unsupported': function () {
    assert.equals(util.statusByColor('fuchsia'), undefined);
  }
});