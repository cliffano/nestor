/*global Buffer: false*/
var dgram = require('dgram'),
    http = require('http'),
    url = require('url'),
    xml2js = require('xml2js');

var Service = function (_url, _http, _dgram) {
    var u = url.parse(_url);
    this.options = {
        host: u.hostname,
        port: u.port
    };
    if (u.auth) {
        this.options.headers = {
            'Authorization': 'Basic ' + new Buffer(u.auth).toString('base64')
        };
    }
    this.http = _http || http;
    this.dgram = _dgram || dgram;
};
Service.prototype.sendHttp = function (path, method, successCb, errorCb) {
    this.options.path = path;
    this.options.method = method;
    var req = this.http.request(this.options, function (res) {
        //console.log('statusCode: ' + res.statusCode);
        //console.log('headers: ' + JSON.stringify(res.headers));
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            successCb(res.statusCode, res.headers, data);
        });
    });
    req.on('error', function (e) {
        errorCb(e);
    });
    req.end();
};
Service.prototype.sendUdp = function (message, _host, port, successCb, errorCb) {
    var socket = this.dgram.createSocket('udp4'),
        buffer = new Buffer(message),
        parser = new xml2js.Parser(),
        host = _host || this.options.host;
    socket.on("error", function (err) {
        socket.close();
        errorCb(err);
    });
    socket.on("message", function (data) {
        socket.close();
        parser.addListener('end', function (data) {
            successCb(data);
        });
        parser.parseString(data)
    });
    socket.send(buffer, 0, buffer.length, port, host, function (err, message) {
        if (err) {
            socket.close();
            errorCb(err);
        }
    });
};

exports.Service = Service;