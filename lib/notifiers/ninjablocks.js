var _ = require('lodash'),
  ninjaBlocks = require('ninja-blocks');

/**
 * class NinjaBlocks
 *
 * @param {String} token: Ninja Blocks API Access Token https://a.ninja.is/hacking
 */
function NinjaBlocks(token) {
  this.token = token;
}

/**
 * Notify build status as a colour on RGB LED device (the eyes on Ninja Blocks).
 *
 * @param {String} status: build status
 */
NinjaBlocks.prototype.notify = function (status) {
  const COLOURS = {
      OK: '00FF00',
      FAIL: 'FF0000',
      WARN: 'FFFF00'
    },
    UNKNOWN = 'FFFFFF';

  var app = ninjaBlocks.app({ user_access_token: this.token });
  app.devices({ device_type: 'rgbled', default_name: 'Nina\'s Eyes' }, function(err, devices) {
    if (err) {
      console.error(err.message);
    } else if (!_.isEmpty(devices)) {
      Object.keys(devices).forEach(function (key) {
        var colour = COLOURS[status] || UNKNOWN;
        console.log('Setting rgbled device colour to %s for status %s', colour, status);
        app.device(key).actuate(colour);
      });
    } else {
      console.warn('No rgbled device found');
    }
  });
};

module.exports = NinjaBlocks;
