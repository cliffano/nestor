"use strict";
/* eslint no-unused-vars: 0 */
import referee from '@sinonjs/referee';
import util from '../../lib/cli/util.js';
const assert = referee.assert;

describe('cli - util - colorByStatus', function() {
  it('should show the correct color when Jenkins color contains non-status and not animated color', function () {
    assert.equals(util.colorByStatus('somestatus', 'blue'), 'blue');
    assert.equals(util.colorByStatus('somestatus', 'green'), 'green');
    assert.equals(util.colorByStatus('somestatus', 'grey'), 'grey');
    assert.equals(util.colorByStatus('somestatus', 'red'), 'red');
    assert.equals(util.colorByStatus('somestatus', 'yellow'), 'yellow');
  });
  it('should show the correct color when Jenkins color contains animated color', function () {
    assert.equals(util.colorByStatus('somestatus', 'blue_anime'), 'blue');
    assert.equals(util.colorByStatus('somestatus', 'green_anime'), 'green');
    assert.equals(util.colorByStatus('somestatus', 'grey_anime'), 'grey');
    assert.equals(util.colorByStatus('somestatus', 'red_anime'), 'red');
    assert.equals(util.colorByStatus('somestatus', 'yellow_anime'), 'yellow');
  });
  it('should show grey color when Jenkins color is a status', function () {
    assert.equals(util.colorByStatus('somestatus', 'somestatus'), 'grey');
  });
  it('should show grey color when Jenkins color is undefined', function () {
    assert.equals(util.colorByStatus('somestatus', undefined), 'grey');
  });
  it('should show color based ons status when Jenkins color is not provided and status is known', function () {
    assert.equals(util.colorByStatus('failure'), 'red');
    assert.equals(util.colorByStatus('success'), 'green');
    assert.equals(util.colorByStatus('building'), 'yellow');
  });
  it('should show grey color when Jenkins color is not provided and status is unknown', function () {
    assert.equals(util.colorByStatus('somestatus'), 'grey');
  });
});

describe('cli - util - statusByColor', function() {
  it('should show the correct status for all supported colors', function () {
    assert.equals(util.statusByColor('blue'), 'ok');
    assert.equals(util.statusByColor('green'), 'ok');
    assert.equals(util.statusByColor('grey'), 'aborted');
    assert.equals(util.statusByColor('red'), 'fail');
    assert.equals(util.statusByColor('yellow'), 'warn');
  });
  it('should show the correct status for actively running build', function () {
    assert.equals(util.statusByColor('blue_anime'), 'ok');
    assert.equals(util.statusByColor('green_anime'), 'ok');
    assert.equals(util.statusByColor('grey_anime'), 'aborted');
    assert.equals(util.statusByColor('red_anime'), 'fail');
    assert.equals(util.statusByColor('yellow_anime'), 'warn');
  });
  it('should return value as-is when status is a real status value', function () {
    assert.equals(util.statusByColor('notbuilt'), 'notbuilt');
  });
  it('should show the correct status for undefined job color', function () {
    assert.equals(util.statusByColor(undefined), 'unknown');
  });
});
