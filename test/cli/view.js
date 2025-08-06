"use strict";
/* eslint no-unused-vars: 0 */
import fs from 'fs';
import Jenkins from '../../lib/jenkins.js';
import view from '../../lib/cli/view.js';
import referee from '@sinonjs/referee';
import sinon from 'sinon';
const assert = referee.assert;

describe('cli - view', function() {
  beforeEach(function (done) {
    this.mockConsole = sinon.mock(console);
    this.mockFs = sinon.mock(fs);
    this.mockProcess = sinon.mock(process);

    const jenkins = new Jenkins('http://localhost:8080');
    this.mockCb = function (command, cb) {
      cb(jenkins);
    };
    done();
  });
  afterEach(function (done) {
    this.mockConsole.verify();
    this.mockFs.verify();
    this.mockProcess.verify();
    sinon.restore();
    done();
  });
  it('create - should log view created success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('View someview was created successfully');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'createView').value(function (name, config, cb) {
      assert.equals(name, 'someview');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    view.create(this.mockCb)(null, ['someview', 'config.xml']);
  });
  it('update - should log view updated success message', function () {
    this.mockConsole.expects('log').once().withExactArgs('View someview was updated successfully');
    this.mockFs.expects('readFileSync').once().withExactArgs('config.xml').returns('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'updateView').value(function (name, config, cb) {
      assert.equals(name, 'someview');
      assert.equals(config, '<xml>some config</xml>');
      cb();
    });

    view.update(this.mockCb)(null, ['someview', 'config.xml']);
  });
  it('fetchConfig - should log configuration', function () {
    this.mockConsole.expects('log').once().withExactArgs('<xml>some config</xml>');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'fetchViewConfig').value(function (name, cb) {
      assert.equals(name, 'someview');
      cb(null, '<xml>some config</xml>');
    });

    view.fetchConfig(this.mockCb)(null, ['someview']);
  });
});