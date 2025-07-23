"use strict";
import cli from 'bagofcli';
import fs from 'fs';
import text from 'bagoftext';

/**
 * Get a handler that calls Jenkins API to create a view with specific configuration.
 * Success view creation message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function create(cb) {
  return function (args, name, configFile) {
    function resultCb(result) {
      console.log(text.__('View %s was created successfully'), name);
    }
    function jenkinsCb(jenkins) {
      const config = fs.readFileSync(configFile).toString();
      jenkins.createView(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to update a view with specific configuration.
 * Success view update message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function update(cb) {
  return function (args, name, configFile) {
    function resultCb(result) {
      console.log(text.__('View %s was updated successfully'), name);
    }
    function jenkinsCb(jenkins) {
      const config = fs.readFileSync(configFile).toString();
      jenkins.updateView(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

/**
 * Get a handler that calls Jenkins API to fetch a view configuration.
 * Jenkins view config.xml will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function fetchConfig(cb) {
  return function (args, name) {
    function resultCb(result) {
      console.log(result);
    }
    function jenkinsCb(jenkins) {
      jenkins.fetchViewConfig(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

const exports = {
  create: create,
  update: update,
  fetchConfig: fetchConfig
};

export {
  exports as default
};