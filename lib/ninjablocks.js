var _ = require('underscore'),
  ninjaBlocks = require('ninja-blocks');

function NinjaBlocks(token) {
  this.token = token;
}

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