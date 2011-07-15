var Nestor = function (service, _console) {
    this.service = service;
    this.console = _console || console;
    this.errorCb = function (e) {
        this.console.error(e.message);
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
                    (parseInt(action, 10) === statusCode)) {
                    actions[action]();
                    handled = true;
                }
            }
        }
        if (!handled) {
            this.console.error('Unexpected status code ' + statusCode);
        }
    }
};
Nestor.prototype.dashboard = function () {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var actions = {
                'ok': function () {
                    var jobs = JSON.parse(result).jobs,
                        statuses = {
                            'red': 'FAIL',
                            'blue': 'OK',
                            'green': 'OK',
                            'yellow': 'WARN',
                            'grey': 'ABORT'
                        };
                    if (jobs && jobs.length > 0) {
                        jobs.forEach(function (job) {
                            that.console.log(statuses[job.color] + '\t' + job.name);
                        });
                    } else {
                        that.console.log('Jobless Jenkins');
                    }
                }
            };
            that._handle(statusCode, actions);
        };
    this.service.send('/api/json', 'GET', successCb, this.errorCb);
};
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
            };
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
                        items.forEach(function (item) {
                            that.console.log(item.task.name);
                        });
                    } else {
                        that.console.log('Queue is empty');
                    }
                }
            };
            that._handle(statusCode, actions);
        };
    this.service.send('/queue/api/json', 'GET', successCb, this.errorCb);
};
Nestor.prototype.executor = function () {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var actions = {
                'ok': function () {
                    var computers = JSON.parse(result).computer;
                    computers.forEach(function (computer) {
                        that.console.log('* ' + computer.displayName);
                        computer.executors.forEach(function (executor) {
                            if (executor.idle) {
                                that.console.log('idle');
                            } else {
                                that.console.log(executor.progress + '%\t' + executor.currentExecutable.url.replace(/.*\/job\//, '').replace(/\/.*/, ''));
                            }
                        });
                    });
                }
            };
            that._handle(statusCode, actions);
        };
    this.service.send('/computer/api/json?depth=1', 'GET', successCb, this.errorCb);
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
            };
            that._handle(statusCode, actions);
        };
    this.service.send('/', 'HEAD', successCb, this.errorCb);
};

exports.Nestor = Nestor;
