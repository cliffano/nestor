"use strict";
/* eslint no-unused-vars: 0 */
import Jenkins from '../../lib/jenkins.js';
import jenkins from '../../lib/cli/jenkins.js';
import referee from '@sinonjs/referee';
import sinon from 'sinon';
const assert = referee.assert;

describe('cli - jenkins', function() {
  beforeEach(function (done) {
    this.mockConsole = sinon.mock(console);
    this.mockProcess = sinon.mock(process);

    const jenkins = new Jenkins('http://localhost:8080');
    this.mockCb = function (command, cb) {
      cb(jenkins);
    };
    done();
  });
  afterEach(function (done) {
    this.mockConsole.verify();
    this.mockProcess.verify();
    sinon.restore();
    done();
  });
  it('dashboard - should log Jobless Jenkins when exec dashboard is called and there is no job', function () {
    this.mockConsole.expects('log').once().withExactArgs('Jobless Jenkins');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'info').value(function (cb) {
      const result = { jobs: [] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockCb)();
  });
  it('dashboard - should log statuses when exec dashboard is called and Jenkins has running jobs', function () {
    const status1 = 'ok'.blue;
    this.mockConsole.expects('log').once().withExactArgs(`${status1} - job1`);
    const status2 = 'ok'.green;
    this.mockConsole.expects('log').once().withExactArgs(`${status2} - job2`);
    const status3 = 'aborted'.grey;
    this.mockConsole.expects('log').once().withExactArgs(`${status3} - job3`);
    const status4 = 'fail'.red;
    this.mockConsole.expects('log').once().withExactArgs(`${status4} - job4`);
    const status5 = 'warn'.yellow;
    this.mockConsole.expects('log').once().withExactArgs(`${status5} - job5`);
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'info').value(function (cb) {
      const result = { jobs: [
          { name: 'job1', color: 'blue' },
          { name: 'job2', color: 'green' },
          { name: 'job3', color: 'grey' },
          { name: 'job4', color: 'red' },
          { name: 'job5', color: 'yellow' }
        ] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockCb)();
  });
  it('dashboard - should log statuses when exec dashboard is called and Jenkins has running jobs with animated value', function () {
    const status1 = 'aborted'.grey;
    this.mockConsole.expects('log').once().withExactArgs(`${status1} - job1`);
    const status2 = 'fail'.red;
    this.mockConsole.expects('log').once().withExactArgs(`${status2} - job2`);
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'info').value(function (cb) {
      const result = { jobs: [
          { name: 'job1', color: 'grey_anime' },
          { name: 'job2', color: 'red_anime' },
        ] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockCb)();
  });
  it('dashboard - should log statuses when exec dashboard is called and Jenkins has running jobs with unknown color value', function () {
    const status1 = 'someunknownstatus'.grey;
    this.mockConsole.expects('log').once().withExactArgs(`${status1} - job1`);
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'info').value(function (cb) {
      const result = { jobs: [
          { name: 'job1', color: 'someunknownstatus' }
        ] };
      cb(null, result);
    });

    jenkins.dashboard(this.mockCb)();
  });
  it('discover - should log version and url when exec discover is called and there is a running Jenkins instance', function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. 1.2.3 is running on http://localhost:8080/');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'discover').value(function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });

    jenkins.discover(this.mockCb)();
  });
  it('discover - should log version and url when exec discover is called with specified host', function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. 1.2.3 is running on http://localhost:8080/');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'discover').value(function (host, cb) {
      assert.equals(host, 'somehost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['http://localhost:8080/'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });

    jenkins.discover(this.mockCb)({}, ['somehost']);
  });
  it('discover - should log host instead of url when exec discover result does not include any url', function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. 1.2.3 is running on localhost');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'discover').value(function (host, cb) {
      assert.equals(host, 'localhost');
      cb(null, {
        hudson: {
          version: ['1.2.3'],
          url: ['localhost'],
          'server-id': ['362f249fc053c1ede86a218587d100ce'],
          'slave-port': ['55325']
        }
      });
    });

    jenkins.discover(this.mockCb)();
  });
  it('executor -should log no executor found when exec executor is called and there is no executor', function () {
    this.mockConsole.expects('log').once().withExactArgs('No executor found');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'computer').value(function (cb) {
      const result = { computer: [] };
      cb(null, result);
    });

    jenkins.executor(this.mockCb)();
  });
  it('executor -should pass correct idle, stuck, and progress status', function () {
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'master', '1 active, 1 idle');
    this.mockConsole.expects('log').once().withExactArgs('  - %s | %s%%s', 'job1', 88, '');
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'slave1', '1 active');
    this.mockConsole.expects('log').once().withExactArgs('  - %s | %s%%s', 'job2', 88, ' stuck!');
    this.mockConsole.expects('log').once().withExactArgs('+ %s | %s', 'slave2', '1 idle');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'computer').value(function (cb) {
      const result = { computer: [
          {
            displayName: 'master',
            executors: [
              { idle: false, likelyStuck: false, progress: 88, currentExecutable: { url: 'http://localhost:8080/job/job1/19/' } },
              { idle: true, likelyStuck: false, progress: 0 }
            ]
          },
          {
            displayName: 'slave1',
            executors: [
              { idle: false, likelyStuck: true, progress: 88, currentExecutable: { url: 'http://localhost:8080/job/job2/30/' } }
            ]
          },
          {
            displayName: 'slave2',
            executors: [
              { idle: true, likelyStuck: false, progress: 0 }
            ]
          }
        ]};
      cb(null, result);
    });

    jenkins.executor(this.mockCb)();
  });
  it('feed -should parse job feed when job arg is provided', function () {
    this.mockConsole.expects('log').once().withExactArgs('Some title 1');
    this.mockConsole.expects('log').once().withExactArgs('Some title 2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'parseJobFeed').value(function (name, cb) {
      assert.equals(name, 'somejob');
      const result = { items: [
        { title: 'Some title 1' },
        { title: 'Some title 2' }
      ]};
      cb(null, result);
    });

    jenkins.feed(this.mockCb)({ job: 'somejob' });
  });
  it('feed -should parse view feed when view arg is provided', function () {
    this.mockConsole.expects('log').once().withExactArgs('Some title 1');
    this.mockConsole.expects('log').once().withExactArgs('Some title 2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'parseViewFeed').value(function (name, cb) {
      assert.equals(name, 'someview');
      const result = { items: [
        { title: 'Some title 1' },
        { title: 'Some title 2' }
      ]};
      cb(null, result);
    });

    jenkins.feed(this.mockCb)({ view: 'someview' });
  });
  it('feed -should parse Jenkins feed when neither job or view arg is provided', function () {
    this.mockConsole.expects('log').once().withExactArgs('Some title 1');
    this.mockConsole.expects('log').once().withExactArgs('Some title 2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'parseFeed').value(function (cb) {
      const result = { items: [
        { title: 'Some title 1' },
        { title: 'Some title 2' }
      ]};
      cb(null, result);
    });

    jenkins.feed(this.mockCb)({});
  });
  it('queue -should log queue empty message when there is no item', function () {
    this.mockConsole.expects('log').once().withExactArgs('Queue is empty');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'queue').value(function (cb) {
      const result = { items: [] };
      cb(null, JSON.stringify(result));
    });

    jenkins.queue(this.mockCb)();
  });
  it('queue -should log job names when result contains items', function () {
    this.mockConsole.expects('log').once().withExactArgs('- %s', 'job1');
    this.mockConsole.expects('log').once().withExactArgs('- %s', 'job2');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'queue').value(function (cb) {
      const result = { items: [
        { task: { name: 'job1' }},
        { task: { name: 'job2' }}
        ] };
      cb(null, result);
    });

    jenkins.queue(this.mockCb)();
  });
  it('version - should log version when exec ver is called and version exists', function () {
    this.mockConsole.expects('log').once().withExactArgs('Jenkins ver. 1.2.3');
    this.mockProcess.expects('exit').once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, 'version').value(function (cb) {
      cb(null, '1.2.3');
    });

    jenkins.version(this.mockCb)();
  });
});