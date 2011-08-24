var Nestor = function (service, errorCb) {
    this.STATUS = {
        'red': 'FAIL',
        'blue': 'OK',
        'green': 'OK',
        'yellow': 'WARN',
        'grey': 'ABORT'
    };
    this.service = service;
    this.errorCb = errorCb;
};
Nestor.prototype._handle = function (statusCode, opts, cb) {
    var err, result, opt, val;
    if (statusCode === 401 || statusCode === 403) {
        err = new Error('Username and password are required');
    } else {
        for (opt in opts) {
            if (opts.hasOwnProperty(opt)) {
                if ((opt === 'ok' && !statusCode.toString().match(/^(4|5)/)) ||
                        (parseInt(opt, 10) === statusCode)) {
                    val = opts[opt]();
                    // TODO: fix error identification
                    if (val.message) {
                        err = val;
                    } else {
                        result = val;
                    }
                }
            }
        }
        if (!err && !result) {
            err = new Error('Unexpected status code ' + statusCode);
        }
    }
    cb(err, result);
};
Nestor.prototype.dashboard = function (cb) {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var opts = {
                'ok': function () {
                    var jobs = JSON.parse(result).jobs, data = [];
                    if (jobs && jobs.length > 0) {
                        jobs.forEach(function (job) {
                            data.push({ status: that.STATUS[job.color], name: job.name });
                        });
                    }
                    return data;
                }
            };
            that._handle(statusCode, opts, cb);
        };
    this.service.sendHttp('/api/json', 'GET', successCb, this.errorCb);
};
Nestor.prototype.job = function (job, cb) {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var opts = {
                404: function () {
                    return new Error('Job does not exist');
                },
                'ok': function () {
                    var json = JSON.parse(result), data = {};
                    data.status = that.STATUS[json.color];
                    data.reports = [];
                    json.healthReport.forEach(function (report) {
                        data.reports.push(report.description);
                    });
                    return data;
                }
            };
            that._handle(statusCode, opts, cb);
        };
    this.service.sendHttp('/job/' + job + '/api/json', 'GET', successCb, this.errorCb);
};
Nestor.prototype.build = function (job, params, cb) {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var opts = {
                404: function () {
                    return new Error('Job does not exist');
                },
                'ok': function () {
                    return { status: 'ok' };
                }
            };
            that._handle(statusCode, opts, cb);
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
    this.service.sendHttp(path, 'POST', successCb, this.errorCb);
};
Nestor.prototype.queue = function (cb) {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var opts = {
                'ok': function () {
                    var items = JSON.parse(result).items, data = [];
                    if (items && items.length > 0) {
                        items.forEach(function (item) {
                            data.push(item.task.name);
                        });
                    }
                    return data;
                }
            };
            that._handle(statusCode, opts, cb);
        };
    this.service.sendHttp('/queue/api/json', 'GET', successCb, this.errorCb);
};
Nestor.prototype.executor = function (cb) {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var opts = {
                'ok': function () {
                    var computers = JSON.parse(result).computer, data = {};
                    computers.forEach(function (computer) {
                        data[computer.displayName] = [];
                        computer.executors.forEach(function (executor) {
                            data[computer.displayName].push({
                                idle: executor.idle,
                                progress: executor.progress,
                                name: (!executor.idle) ? executor.currentExecutable.url.replace(/.*\/job\//, '').replace(/\/.*/, '') : ''
                            });
                        });
                    });
                    return data;
                }
            };
            that._handle(statusCode, opts, cb);
        };
    this.service.sendHttp('/computer/api/json?depth=1', 'GET', successCb, this.errorCb);
};
Nestor.prototype.discover = function (host, cb) {
    var successCb = function (data) {
            cb(null, data);
        },
        errorCb = function (err) {
            cb(err);
        };
    this.service.sendUdp('Long live Jenkins', host, 33848, successCb, errorCb);
};
Nestor.prototype.version = function (cb) {
    var that = this,
        successCb = function (statusCode, headers, result) {
            var opts = {
                'ok': function () {
                    return (headers['x-jenkins']) ? headers['x-jenkins'] : new Error('Not a Jenkins server');
                }
            };
            that._handle(statusCode, opts, cb);
        };
    this.service.sendHttp('/', 'HEAD', successCb, this.errorCb);
};

exports.Nestor = Nestor;
