var buster    = require('buster-node');
var _cli      = require('bagofcli');
var cli       = require('../lib/cli');
var commander = require('commander');
var Jenkins   = require('../lib/jenkins');
var referee   = require('referee');
var text      = require('bagoftext');
var assert    = referee.assert;

text.setLocale('en');

buster.testCase('cli - exec', {
  setUp: function () {
    this.mock({});
  },
  'should contain commands with actions': function (done) {
    var mockCommand = function (base, actions) {
      assert.defined(base);
      assert.defined(actions.commands.dashboard.action);
      assert.defined(actions.commands.discover.action);
      assert.defined(actions.commands.executor.action);
      assert.defined(actions.commands.feed.action);
      assert.defined(actions.commands.queue.action);
      assert.defined(actions.commands.ver.action);
      assert.defined(actions.commands.create.action);
      assert.defined(actions.commands['create-job'].action);
      assert.defined(actions.commands.job.action);
      assert.defined(actions.commands['read-job'].action);
      assert.defined(actions.commands.last.action);
      assert.defined(actions.commands.update.action);
      assert.defined(actions.commands['update-job'].action);
      assert.defined(actions.commands['delete'].action);
      assert.defined(actions.commands['delete-job'].action);
      assert.defined(actions.commands.build.action);
      assert.defined(actions.commands['build-job'].action);
      assert.defined(actions.commands.stop.action);
      assert.defined(actions.commands['stop-job'].action);
      assert.defined(actions.commands.console.action);
      assert.defined(actions.commands.enable.action);
      assert.defined(actions.commands['enable-job'].action);
      assert.defined(actions.commands.disable.action);
      assert.defined(actions.commands['disable-job'].action);
      assert.defined(actions.commands.copy.action);
      assert.defined(actions.commands['copy-job'].action);
      assert.defined(actions.commands.config.action);
      assert.defined(actions.commands['fetch-job-config'].action);
      done();
    };
    this.stub(_cli, 'command', mockCommand);
    cli.exec();
  }
});

buster.testCase('cli - exec', {
  setUp: function () {
    this.mockCli = this.mock(_cli);

    this.stub(Jenkins.prototype, 'crumb', function (cb) {
      var result = {
        '_class': 'hudson.security.csrf.DefaultCrumbIssuer',
        crumb: '7b12516ae03ff48a099aa2f32906dafa',
        crumbRequestField: 'Jenkins-Crumb'
      };
      cb(null, result);
    });
  },
  'should pass URL as-is when there is no interactive arg specified': function (done) {
    var args = {
      parent: {
        url: 'http://someserver:8080'
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://someserver:8080');
      done();
    });
  },
  'should use environment variable as Jenkins URL when there is no interactive arg specified and URL parameter is not specified': function (done) {
    this.stub(process, 'env', {
      JENKINS_URL: 'http://someserver:8080'
    });
    var args = {
      parent: {
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://someserver:8080');
      done();
    });
  },
  'should use default Jenkins URL when there is no interactive arg specified and no environment variable Jenkins URL': function (done) {
    this.stub(process, 'env', {
      JENKINS_URL: null
    });
    var args = {
      parent: {
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://localhost:8080');
      done();
    });
  },
  'should pass username and password to Jenkins URL when interactive arg is set': function (done) {
    this.mockCli.expects('lookupConfig').once().withArgs(['Username', 'Password'], { prompt: true }).callsArgWith(2, null, { Username: 'someuser', Password: 'somepass' });
    var args = {
      parent: {
        url: 'http://someserver:8080',
        interactive: true
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://someuser:somepass@someserver:8080/');
      done();
    });
  }
});
