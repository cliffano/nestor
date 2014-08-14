/**
 * Get status based on color.
 * Jenkins API uses color as status, hence the need for mapping color to status text.
 *
 * @param {String} color: Jenkins status color
 * @return the status text
 */
function statusByColor(color) {

  const STATUSES = {  
    blue  : 'OK',
    green : 'OK',
    grey  : 'ABORTED',
    red   : 'FAIL',
    yellow: 'WARN'
  };

  // Jenkins color value can contain either a color, color_anime, or status in job.color field,
  // hence to get color/status value out of the mix we need to remove the postfix _anime,
  // _anime postfix only exists on a job currently being built
  color = color.replace(/_anime/, '');

  return STATUSES[color] || color.toUpperCase();
};

exports.statusByColor = statusByColor;