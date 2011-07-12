var Nestor = function (service, _console) {
    this.service = service;
    this.console = _console || console;
    this.errorCb = function (e) {
        this.console.error(e.message);
    }
};
Nestor.prototype.build = function (job, params) {
    var that = this,
        successCb = function (headers, result) {
            console.log("HEADERS" + require('sys').inspect(headers));
            console.log("RESULT" + require('sys').inspect(result));
        },
        json = {
            parameter: []
        },
        path;
    if (params) {
        params.split('&').forEach(function (item) {
            var pair = item.split('=');
            json.parameter.push({ name: pair[0], value: pair[1] });
        });
        path = '/job/' + job + '/build?token=nestor&json=' + JSON.stringify(json);
    } else {
        path = '/job/' + job + '/build?token=nestor';
    }
    this.service.send(path, 'POST', successCb, this.errorCb);    
};
Nestor.prototype.queue = function () {
    var that = this,
        successCb = function (headers, result) {
            JSON.parse(result).items.forEach(function (item) {
                that.console.log(item.task.name);
            });
        };
    this.service.send('/queue/api/json', 'GET', successCb, this.errorCb);
};
Nestor.prototype.version = function () {
    var that = this,
        successCb = function (headers, result) {
            if (headers['x-jenkins']) {
                that.console.log(headers['x-jenkins']);
            } else {
                that.console.error('Unknown');
            }
        };
    this.service.send('/', 'HEAD', successCb, this.errorCb);
};

exports.Nestor = Nestor;
