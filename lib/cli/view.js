var cli  = require('bagofcli');
var fs   = require('fs');
var text = require('bagoftext');

/**
 * Get a handler that calls Jenkins API to create a view with specific configuration.
 * Success view creation message will be displayed when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
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

/**
 * Get a handler that calls Jenkins API to update a view with specific configuration.
 * Success view update message will be displayed when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
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

/**
 * Get a handler that calls Jenkins API to fetch a view configuration.
 * Jenkins view config.xml will be displayed when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function fetchConfig(cb) {
  return function (name, args) {
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