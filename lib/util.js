function status(color) {

  var colors = {  
    'blue': 'OK',
    'green': 'OK',
    'grey': 'ABORTED',
    'red': 'FAIL',
    'yellow': 'WARN'
  };

  // remove animation status (only for actively running job)
  color = color.replace(/_anime/, '');

  return (colors[color]) ? (colors[color]) : color.toUpperCase();
}

exports.status = status;