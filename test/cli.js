"use strict";
/* eslint no-unused-vars: 0 */
import _cli from 'bagofcli';
import cli from '../lib/cli.js';
import Jenkins from '../lib/jenkins.js';
import referee from '@sinonjs/referee';
import sinon from 'sinon';
const assert = referee.assert;
const refute = referee.refute;

describe('cli - exec actions', function() {
  it('should contain commands with actions', function (done) {
    const mockCommand = function (base, actions) {
      refute.isUndefined(base);
      refute.isUndefined(actions.commands.dashboard.action);
      refute.isUndefined(actions.commands.discover.action);
      refute.isUndefined(actions.commands.executor.action);
      refute.isUndefined(actions.commands.feed.action);
      refute.isUndefined(actions.commands.queue.action);
      refute.isUndefined(actions.commands.ver.action);
      refute.isUndefined(actions.commands.create.action);
      refute.isUndefined(actions.commands['create-job'].action);
      refute.isUndefined(actions.commands.job.action);
      refute.isUndefined(actions.commands['read-job'].action);
      refute.isUndefined(actions.commands.last.action);
      refute.isUndefined(actions.commands.update.action);
      refute.isUndefined(actions.commands['update-job'].action);
      refute.isUndefined(actions.commands['delete'].action);
      refute.isUndefined(actions.commands['delete-job'].action);
      refute.isUndefined(actions.commands.build.action);
      refute.isUndefined(actions.commands['build-job'].action);
      refute.isUndefined(actions.commands.stop.action);
      refute.isUndefined(actions.commands['stop-job'].action);
      refute.isUndefined(actions.commands.console.action);
      refute.isUndefined(actions.commands.enable.action);
      refute.isUndefined(actions.commands['enable-job'].action);
      refute.isUndefined(actions.commands.disable.action);
      refute.isUndefined(actions.commands['disable-job'].action);
      refute.isUndefined(actions.commands.copy.action);
      refute.isUndefined(actions.commands['copy-job'].action);
      refute.isUndefined(actions.commands.config.action);
      refute.isUndefined(actions.commands['fetch-job-config'].action);
      done();
    };
    sinon.stub(_cli, 'command').value(mockCommand);
    cli.exec();
  });
});

describe('cli - exec', function() {
  beforeEach(function (done) {
    this.mockCli = sinon.mock(_cli);

    sinon.stub(Jenkins.prototype, 'crumb').value(function (cb) {
      const result = {
        '_class': 'hudson.security.csrf.DefaultCrumbIssuer',
        crumb: '7b12516ae03ff48a099aa2f32906dafa',
        crumbRequestField: 'Jenkins-Crumb'
      };
      cb(null, result);
    });
    done();
  });
  afterEach(function (done) {
    this.mockCli.verify();
    sinon.restore();
    done();
  });
  it('should pass URL as-is when there is no interactive arg specified', function (done) {
    const args = {
      parent: {
        url: 'http://someserver:8080'
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://someserver:8080');
      done();
    });
  });
  it('should use environment variable as Jenkins URL when there is no interactive arg specified and URL parameter is not specified', function (done) {
    sinon.stub(process, 'env').value({
      JENKINS_URL: 'http://someserver:8080'
    });
    const args = {
      parent: {
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://someserver:8080');
      done();
    });
  });
  it('should use default Jenkins URL when there is no interactive arg specified and no environment variable Jenkins URL', function (done) {
    sinon.stub(process, 'env').value({
      JENKINS_URL: null
    });
    const args = {
      parent: {
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://localhost:8080');
      done();
    });
  });
  it('should pass username and password to Jenkins URL when interactive arg is set', function (done) {
    this.mockCli.expects('lookupConfig').once().withArgs(['Username', 'Password'], { prompt: true }).callsArgWith(2, null, { Username: 'someuser', Password: 'somepass' });
    const args = {
      parent: {
        url: 'http://someserver:8080',
        interactive: true
      }
    };
    cli.__exec(args, function (jenkins) {
      assert.equals(jenkins.url, 'http://someuser:somepass@someserver:8080/');
      done();
    });
  });
});
