var cli  = require('bagofcli');
var fs   = require('fs');
var text = require('bagoftext');

function create(cb) {
  return function (name, configFile, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was created successfully'), name);
    }
    function jenkinsCb(jenkins) {
      var config = fs.readFileSync(configFile).toString();
      jenkins.createJob(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

function update(cb) {
  return function (name, configFile, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was updated successfully'), name);
    }
    function jenkinsCb(jenkins) {
      var config = fs.readFileSync(configFile).toString();
      jenkins.updateJob(name, config, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

function _delete(cb) {
  return function (name, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was deleted successfully'), name);
    }
    function jenkinsCb(jenkins) {
      jenkins.deleteJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

function enable(cb) {
  return function (name, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was enabled successfully'), name);
    }
    function jenkinsCb(jenkins) {
      jenkins.enableJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

function disable(cb) {
  return function (name, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was disabled successfully'), name);
    }
    function jenkinsCb(jenkins) {
      jenkins.disableJob(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  }; 
}

function copy(cb) {
  return function (existingName, newName, args) {
    function resultCb(result) {
      console.log(text.__('Job %s was copied to job %s'), existingName, newName);
    }
    function jenkinsCb(jenkins) {
      jenkins.copyJob(existingName, newName, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };  
}

function fetchConfig(cb) {
  return function (name, args) {
    function resultCb(result) {
      console.log(result);
    }
    function jenkinsCb(jenkins) {
      jenkins.fetchJobConfig(name, cli.exitCb(null, resultCb));
    }
    cb(args, jenkinsCb);
  };
}

exports.create      = create;
exports.update      = update;
exports.delete      = _delete;
exports.enable      = enable;
exports.disable     = disable;
exports.copy        = copy;
exports.fetchConfig = fetchConfig;