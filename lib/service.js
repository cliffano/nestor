var http = require('http'),
    url = require('url');

var Service = function (_url, _http) {
    var u = url.parse(_url);
    this.options = {
        host: u.hostname,
        port: u.port
    };
    this.http = _http || http;
};
Service.prototype.send = function (path, method, successCb, errorCb) {
    this.options.path = path;
    this.options.method = method;
    var req = this.http.request(this.options, function (res) {
        console.log('statusCode: ' + res.statusCode);
        console.log('headers: ' + JSON.stringify(res.headers));
        if (res.statusCode !== 200 && res.statusCode !== 302) {
            errorCb(new Error('Unexpected status code: ' + res.statusCode));
        } else {
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                successCb(res.headers, data);
            });
        }
    });
    req.on('error', function (e) {
        errorCb(e);
    });
    req.end();
};

exports.Service = Service;