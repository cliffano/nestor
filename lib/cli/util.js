const COLOR_STATUS = {  
  blue  : 'ok',
  green : 'ok',
  grey  : 'aborted',
  red   : 'fail',
  yellow: 'warn'
};

/**
 * Get color based on status and Jenkins status color.
 * Color property can contain either color or status text.
 * Hence the need for mapping color to status text in the case where value is really color.
 * This is used in conjunction with statusByColor function.
 *
 * @param {String} status: Jenkins status
 * @param {String} jenkinsColor: Jenkins status color
 * @return the status text
 */
function colorByStatus(status, jenkinsColor) {

  // Jenkins color value can contain either a color, color_anime, or status in job.color field,
  // hence to get color/status value out of the mix we need to remove the postfix _anime,
  // _anime postfix only exists on a job currently being built
  jenkinsColor = jenkinsColor.replace(/_anime$/, '');

  var color = (COLOR_STATUS[jenkinsColor]) ? jenkinsColor : 'grey';
  return color;
}

/**
 * Get status based on the value of color property.
 * Color property can contain either color or status text.
 * Hence the need for mapping color to status text in the case where value is really color.
 * This is used in conjunction with colorByStatus function.
 *
 * @param {String} jenkinsColor: Jenkins status color
 * @return the status text
 */
function statusByColor(jenkinsColor) {

  // Jenkins color value can contain either a color, color_anime, or status in job.color field,
  // hence to get color/status value out of the mix we need to remove the postfix _anime,
  // _anime postfix only exists on a job currently being built
  jenkinsColor = jenkinsColor.replace(/_anime$/, '');

  var status = COLOR_STATUS[jenkinsColor] || jenkinsColor;
  return status;
}

exports.colorByStatus = colorByStatus;
exports.statusByColor = statusByColor;