var Nestor = function (service, _console) {
    this.service = service;
    this.console = _console || console;
    this.errorCb = function (e) {
        this.console.error(e.message);
    };
    this.unexpected = function (statusCode) {
        this.console.error('Unexpected status code ' + statusCode);
    };
};
Nestor.prototype._handle = function (statusCode, actions) {
    var action, handled = false;
    if (statusCode === 401) {
        this.console.error('Username and password are required');
    } else {
        for (action in actions) {
            if (actions.hasOwnProperty(action)) {
                if ((action === 'ok' && !statusCode.toString().match(/^(4|5)/)) ||
                    (parseInt(action) === statusCode)) {
                    actions[action]();
                    handled = true;
                }
            }
        }
        if (!handled) {
            this.console.error('Unexpected status code ' + statusCode);
        }
    }
}
Nestor.prototype.build = function (job, params) {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var actions = {
                404: function () {
                    that.console.error('Job does not exist');
                },
                'ok': function () {
                    that.console.log('Job was started successfully');
                }
            }
            that._handle(statusCode, actions);
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
    }
    path = '/job/' + job + '/build?token=nestor&json=' + JSON.stringify(json);
    this.service.send(path, 'POST', successCb, this.errorCb);
};
Nestor.prototype.queue = function () {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var actions = {
                'ok': function () {
                    var items = JSON.parse(result).items;
                    if (items && items.length > 0) {
                        JSON.parse(result).items.forEach(function (item) {
                            that.console.log(item.task.name);
                        });
                    } else {
                        that.console.log('Queue is empty');
                    }
                }
            }
            that._handle(statusCode, actions);
        };
    this.service.send('/queue/api/json', 'GET', successCb, this.errorCb);
};
Nestor.prototype.version = function () {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var actions = {
                'ok': function () {
                    if (headers['x-jenkins']) {
                        that.console.log(headers['x-jenkins']);
                    } else {
                        that.console.error('Not a Jenkins server');
                    }
                }
            }
            that._handle(statusCode, actions);
        };
    this.service.send('/', 'HEAD', successCb, this.errorCb);
};

exports.Nestor = Nestor;
