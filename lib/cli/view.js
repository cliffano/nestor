var cli  = require('bagofcli');
var fs   = require('fs');
var text = require('bagoftext');

function create(cb) {
  return function (name, configFile, args) {
    function resultCb(result) {
      console.log(text.__('View %s was created successfully'), name);
    }
    function jenkinsCb(jenkins) {
      var config = fs.readFileSync(configFile).toString();
      jenkins.createView(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

function update(cb) {
  return function (name, configFile, args) {
    function resultCb(result) {
      console.log(text.__('View %s was updated successfully'), name);
    }
    function jenkinsCb(jenkins) {
      var config = fs.readFileSync(configFile).toString();
      jenkins.updateView(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

function fetchConfig(cb) {
  return function (name, configFile, args) {
    function resultCb(result) {
      console.log(result);
    }
    function jenkinsCb(jenkins) {
      jenkins.fetchViewConfig(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

exports.create      = create;
exports.update      = update;
exports.fetchConfig = fetchConfig;