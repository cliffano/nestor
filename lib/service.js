/*global Buffer: false*/
var http = require('http'),
    url = require('url');

var Service = function (_url, _http) {
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
};
Service.prototype.send = function (path, method, successCb, errorCb) {
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

exports.Service = Service;