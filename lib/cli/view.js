"use strict";
import _ from 'lodash';
import cli from 'bagofcli';
import fs from 'fs';

/**
 * Get a handler that calls Jenkins API to create a view with specific configuration.
 * Success view creation message will be logged when there's no error.
 *
 * @param {Function} cb: callback for argument handling
 * @return Jenkins API handler function
 */
function create(cb) {
  return function (command, args) {
    const name = _.get(args, '[0]');
    const configFile = _.get(args, '[1]');

    function resultCb(result) {
      console.log(`View ${name} was created successfully`);
    }
    function jenkinsCb(jenkins) {
      const config = fs.readFileSync(configFile).toString();
      jenkins.createView(name, config, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
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
  return function (command, args) {
    const name = _.get(args, '[0]');
    const configFile = _.get(args, '[1]');

    function resultCb(result) {
      console.log(`View ${name} was updated successfully`);
    }
    function jenkinsCb(jenkins) {
      const config = fs.readFileSync(configFile).toString();
      jenkins.updateView(name, config, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
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
  return function (command, args) {
    const name = _.get(args, '[0]');

    function resultCb(result) {
      console.log(result);
    }
    function jenkinsCb(jenkins) {
      jenkins.fetchViewConfig(name, cli.exitCb(null, resultCb));
    }
    cb(command, jenkinsCb);
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