"use strict";
import _ from 'lodash';

const COLOR_STATUS = {
  blue  : [ 'ok' ],
  green : [ 'ok', 'success' ],
  grey  : [ 'aborted', 'unknown' ],
  red   : [ 'fail', 'failure' ],
  yellow: [ 'warn', 'building' ]
};

/**
 * Get color based on status and Jenkins status color.
 * Jenkins status color will take precedence over status because
 * Jenkins uses either blue or green as the color for ok status.
 *
 * Color property can contain either color or status text.
 * Hence the need for mapping color to status text in the case where value is really color.
 * This is used in conjunction with statusByColor function.
 *
 * @param {String} status: Jenkins status
 * @param {String} jenkinsColor: Jenkins status color
 * @return the status text
 */
function colorByStatus(status, jenkinsColor) {

  let color;

  if (jenkinsColor) {
    // Jenkins color value can contain either a color, color_anime, or status in job.color field,
    // hence to get color/status value out of the mix we need to remove the postfix _anime,
    // _anime postfix only exists on a job currently being built
    jenkinsColor = jenkinsColor.replace(/_anime$/, '');
    color = (COLOR_STATUS[jenkinsColor] && COLOR_STATUS[jenkinsColor][0]) ? jenkinsColor : 'grey';
  } else {
    color = 'grey';
    _.keys(COLOR_STATUS).forEach(function (_color) {
      COLOR_STATUS[_color].forEach(function (_status) {
        if (_status === status) {
          color = _color;
        }
      });
    });
  }

  return color;
}

/**
 * Get status based on the value of color property.
 *
 * Color property can contain either color or status text.
 * Hence the need for mapping color to status text in the case where value is really color.
 * This is used in conjunction with colorByStatus function.
 *
 * @param {String} jenkinsColor: Jenkins status color
 * @return the status text
 */
function statusByColor(jenkinsColor) {

  let status;
  if (jenkinsColor) {

    // Jenkins color value can contain either a color, color_anime, or status in job.color field,
    // hence to get color/status value out of the mix we need to remove the postfix _anime,
    // _anime postfix only exists on a job currently being built
    jenkinsColor = jenkinsColor.replace(/_anime$/, '');

    status = (COLOR_STATUS[jenkinsColor]) ? COLOR_STATUS[jenkinsColor][0] : jenkinsColor;
  } else {
    status = 'unknown';
  }

  return status;
}

const exports = {
  colorByStatus: colorByStatus,
  statusByColor: statusByColor
};

export {
  exports as default
};
