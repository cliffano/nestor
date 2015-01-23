var buster  = require('buster-node');
var referee = require('referee');
var text    = require('bagoftext');
var util    = require('../../lib/cli/util');
var assert  = referee.assert;

text.setLocale('en');

buster.testCase('cli - util - colorByStatus', {
  'should show the correct color when Jenkins color contains non-status and not animated color': function () {
    assert.equals(util.colorByStatus('somestatus', 'blue'), 'blue');
    assert.equals(util.colorByStatus('somestatus', 'green'), 'green');
    assert.equals(util.colorByStatus('somestatus', 'grey'), 'grey');
    assert.equals(util.colorByStatus('somestatus', 'red'), 'red');
    assert.equals(util.colorByStatus('somestatus', 'yellow'), 'yellow');
  },
  'should show the correct color when Jenkins color contains animated color': function () {
    assert.equals(util.colorByStatus('somestatus', 'blue_anime'), 'blue');
    assert.equals(util.colorByStatus('somestatus', 'green_anime'), 'green');
    assert.equals(util.colorByStatus('somestatus', 'grey_anime'), 'grey');
    assert.equals(util.colorByStatus('somestatus', 'red_anime'), 'red');
    assert.equals(util.colorByStatus('somestatus', 'yellow_anime'), 'yellow');
  },
  'should show grey color when Jenkins color is a status': function () {
    assert.equals(util.colorByStatus('somestatus', 'somestatus'), 'grey');
  }
});

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