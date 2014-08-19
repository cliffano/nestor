/**
 * Get status based on the value of color property.
 * Color property can contain either color or status text.
 * Hence the need for mapping color to status text in the case where value is really color.
 *
 * @param {String} color: Jenkins status color
 * @return the status text
 */
function statusByColor(color) {

  const STATUSES = {  
    blue  : 'ok',
    green : 'ok',
    grey  : 'aborted',
    red   : 'fail',
    yellow: 'warn'
  };

  // Jenkins color value can contain either a color, color_anime, or status in job.color field,
  // hence to get color/status value out of the mix we need to remove the postfix _anime,
  // _anime postfix only exists on a job currently being built
  color = color.replace(/_anime/, '');

  return STATUSES[color] || color;
}

exports.statusByColor = statusByColor;