/*jshint esnext: true */
var _BuildLight = require('buildlight');

/**
 * class BuildLight
 *
 * @param {String} opts: optional
 * - scheme: color scheme array, defaults to [ 'red', 'green', 'blue' ]
 *           scheme allows flexibility to use BuildLight with various Delcom devices (RGB, RGY)
 * - usbled: path to usbled installation, if not specified then it will try to
 *           find a usbled installation at /sys/bus/usb/drivers/usbled/
 */
function BuildLight(opts) {
  this.opts = opts || {};
}

/**
 * Notify build status as a colour on Delcom USB Visual Indocator build light.
 *
 * @param {String} status: build status
 */
BuildLight.prototype.notify = function (status) {
  const COLOURS = {
      OK: 'green',
      FAIL: 'red',
      WARN: 'on' // all colours switched on is closer to yellow
    },
    UNKNOWN = 'blue';

  var buildLight = new _BuildLight(this.opts);
  buildLight[COLOURS[status] || UNKNOWN]();
};

module.exports = BuildLight;
