var dgram = require('dgram'),
  _http = require('http'),
  p = require('path'),
  xml2js = require('xml2js');

/**
 * comm#http(path, method, url, cb)
 * - path (String): API path relative to Jenkins instance URL
 * - method (String): http method
 * - url (String): Jenkins instance URL with format http(s)://username:password@host:port/path-if-any/
 *
 * Send request to Jenkins HTTP API.
 * Used by all Nestor commands other than discover.
 **/
function http(path, method, url, cb) {

  function resCb(res) {

    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {

      var result = {
        statusCode: res.statusCode,
        headers: res.headers,
        data: data
      };

      //console.log('response result: ' + JSON.stringify(result));
      cb(null, result);
    });
  }

  var req = _http.request({
    path: p.join(url.pathname, path),
    method: method,
    host: url.hostname,
    port: url.port,
    headers: (url.auth)
      ? { 'Authorization': 'Basic ' + new Buffer(url.auth).toString('base64') }
      : null
  }, resCb);

  req.on('error', cb);
  req.end();  
}

/**
 * comm#udp(message, host, port, cb)
 * - message (String): message to be sent to Jenkins
 * - host (String): Jenkins host name
 * - port (String): Jenkins port number
 * - cb (Function): standard cb(err, result) callback
 *
 * Send UDP message to a Jenkins instance.
 * This is only used by Nestor discover command.
 **/
function udp(message, host, port, cb) {

  var socket = dgram.createSocket('udp4'),
    buffer = new Buffer(message),
    parser = new xml2js.Parser();
  
  socket.on('error', function (err) {
    socket.close();
    cb(err);
  });

  socket.on('message', function (result) {
    socket.close();
    parser.addListener('end', function (result) {
      cb(null, result);
    });
    parser.parseString(result);
  });

  socket.send(buffer, 0, buffer.length, port, host, function (err, result) {
    if (err) {
      socket.close();
      cb(err);
    }
  });
}

exports.http = http;
exports.udp = udp;