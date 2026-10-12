"use strict";
/* eslint no-unused-vars: 0 */
import cron from "cron";
import fs from "fs";
import Jenkins from "../lib/jenkins.js";
import referee from "@sinonjs/referee";
import sinon from "sinon";
const assert = referee.assert;

describe("jenkins - jenkins", function () {
  beforeEach(function (done) {
    sinon.stub(process, "env").value({});
    this.mockFs = sinon.mock(fs);
    this.jenkins = new Jenkins();
    done();
  });
  afterEach(function (done) {
    this.mockFs.verify();
    sinon.restore();
    done();
  });
  it("should use custom url when specified", function () {
    const jenkins = new Jenkins("https://jenkins-ci.org:8080");
    assert.equals(jenkins.url, "https://jenkins-ci.org:8080");
  });
  it("should use default url when url is not specified", function () {
    assert.equals(this.jenkins.url, "http://localhost:8080");
  });
  it("should handle authentication failure error", function (done) {
    this.jenkins.opts.handlers[401](null, function (err) {
      assert.equals(
        err.message,
        "Authentication failed - incorrect username and/or password",
      );
      done();
    });
  });
  it("should handle authentication required error", function (done) {
    this.jenkins.opts.handlers[403](null, function (err) {
      assert.equals(
        err.message,
        "Jenkins requires authentication - please set username and password",
      );
      done();
    });
  });
  it("should set agent options when cert, key and ca are specified", function () {
    this.mockFs
      .expects("statSync")
      .once()
      .withExactArgs("certificate.pem")
      .returns(true);
    this.mockFs
      .expects("statSync")
      .once()
      .withExactArgs("key.pem")
      .returns(true);
    this.mockFs
      .expects("statSync")
      .once()
      .withExactArgs("custom.ca.pem")
      .returns(true);
    this.mockFs
      .expects("readFileSync")
      .once()
      .withExactArgs("certificate.pem")
      .returns("somecert");
    this.mockFs
      .expects("readFileSync")
      .once()
      .withExactArgs("key.pem")
      .returns("somekey");
    this.mockFs
      .expects("readFileSync")
      .once()
      .withExactArgs("custom.ca.pem")
      .returns("someca");
    sinon.stub(process, "env").value({
      JENKINS_CERT: "certificate.pem",
      JENKINS_CA: "custom.ca.pem",
      JENKINS_KEY: "key.pem:somepassphrase",
    });
    const jenkins = new Jenkins();
    assert.equals(jenkins.opts.agentOptions.passphrase, "somepassphrase");
    assert.equals(jenkins.opts.agentOptions.secureProtocol, "TLSv1_method");
    assert.equals(jenkins.opts.agentOptions.cert, "somecert");
    assert.equals(jenkins.opts.agentOptions.key, "somekey");
    assert.equals(jenkins.opts.agentOptions.ca, "someca");
  });
  it("should not set cert, key and ca agent options when the files do not exist", function () {
    this.mockFs
      .expects("statSync")
      .once()
      .withExactArgs("certificate.pem")
      .returns(false);
    this.mockFs
      .expects("statSync")
      .once()
      .withExactArgs("key.pem")
      .returns(false);
    this.mockFs
      .expects("statSync")
      .once()
      .withExactArgs("custom.ca.pem")
      .returns(false);
    this.mockFs.expects("readFileSync").never();
    sinon.stub(process, "env").value({
      JENKINS_CERT: "certificate.pem",
      JENKINS_CA: "custom.ca.pem",
      JENKINS_KEY: "key.pem:somepassphrase",
    });
    const jenkins = new Jenkins();
    assert.equals(jenkins.opts.agentOptions.passphrase, "somepassphrase");
    assert.equals(jenkins.opts.agentOptions.secureProtocol, "TLSv1_method");
    assert.isUndefined(jenkins.opts.agentOptions.cert);
    assert.isUndefined(jenkins.opts.agentOptions.key);
    assert.isUndefined(jenkins.opts.agentOptions.ca);
  });
  it("should not set key and ca agent options when key path and ca are not specified", function () {
    this.mockFs
      .expects("statSync")
      .once()
      .withExactArgs("certificate.pem")
      .returns(true);
    this.mockFs
      .expects("readFileSync")
      .once()
      .withExactArgs("certificate.pem")
      .returns("somecert");
    sinon.stub(process, "env").value({
      JENKINS_CERT: "certificate.pem",
      JENKINS_KEY: ":somepassphrase",
    });
    const jenkins = new Jenkins();
    assert.equals(jenkins.opts.agentOptions.passphrase, "somepassphrase");
    assert.equals(jenkins.opts.agentOptions.cert, "somecert");
    assert.isUndefined(jenkins.opts.agentOptions.key);
    assert.isUndefined(jenkins.opts.agentOptions.ca);
  });
});

describe("jenkins - csrf", function () {
  it("should add crumb header", function (done) {
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "crumb").value(function (cb) {
      const result = {
        _class: "hudson.security.csrf.DefaultCrumbIssuer",
        crumb: "7b12516ae03ff48a099aa2f32906dafa",
        crumbRequestField: "Jenkins-Crumb",
      };
      cb(null, result);
    });
    jenkins.csrf(function (err, result) {
      assert.equals(
        jenkins.opts.headers["Jenkins-Crumb"],
        "7b12516ae03ff48a099aa2f32906dafa",
      );
      done();
    });
  });
  it("should pass error to callback", function (done) {
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "crumb").value(function (cb) {
      cb(new Error("some error"));
    });
    jenkins.csrf(function (err, result) {
      assert.equals(err.message, "some error");
      done();
    });
  });
});

describe("jenkins - monitor", function () {
  it("should monitor all jobs on Jenkins instance when no job or view opt specified", function (done) {
    sinon.stub(cron.CronJob.prototype, "start").value(function () {
      done();
    });
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "info").value(function (cb) {
      const result = {
        jobs: [
          { color: "blue" },
          { color: "red" },
          { color: "yellow" },
          { color: "notbuilt" },
        ],
      };
      cb(null, result);
    });
    jenkins.monitor({ schedule: "*/30 * * * * *" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, "fail");
    });
  });
  it("should monitor every minute when schedule opt is not specified", function (done) {
    sinon.stub(cron.CronJob.prototype, "start").value(function () {
      assert.equals(this.cronTime.source, "0 * * * * *");
      done();
    });
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "info").value(function (cb) {
      cb(null, { jobs: [{ color: "blue" }] });
    });
    jenkins.monitor({}, function (err, result) {
      assert.isNull(err);
      assert.equals(result, "ok");
    });
  });
  it("should result in status non-success when a job has non-success color but no red and yellow", function (done) {
    sinon.stub(cron.CronJob.prototype, "start").value(function () {
      done();
    });
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "info").value(function (cb) {
      const result = {
        jobs: [{ color: "blue" }, { color: "notbuilt" }, { color: "blue" }],
      };
      cb(null, result);
    });
    jenkins.monitor({ schedule: "*/30 * * * * *" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, "notbuilt");
    });
  });
  it("should result in status success when a job has all blue or green color", function (done) {
    sinon.stub(cron.CronJob.prototype, "start").value(function () {
      done();
    });
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "info").value(function (cb) {
      const result = {
        jobs: [{ color: "blue" }, { color: "green" }, { color: "blue" }],
      };
      cb(null, result);
    });
    jenkins.monitor({ schedule: "*/30 * * * * *" }, function (err, result) {
      assert.isNull(err);
      assert.equals(result, "ok");
    });
  });
  it("should result in status warn when view opt is specified and a job has yellow color but no red", function (done) {
    sinon.stub(cron.CronJob.prototype, "start").value(function () {
      done();
    });
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "readView").value(function (name, cb) {
      assert.equals(name, "someview");
      const result = { jobs: [{ color: "blue" }, { color: "yellow" }] };
      cb(null, result);
    });
    jenkins.monitor(
      { view: "someview", schedule: "*/30 * * * * *" },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result, "warn");
      },
    );
  });
  // it('should pass error when an error occurs while monitoring a view').value(function (done) {
  //   sinon.stub(cron.CronJob.prototype, 'start').value(function () {
  //   });
  //   const jenkins = new Jenkins('http://localhost:8080');
  //   sinon.stub(Jenkins.prototype, 'readView').value(function (name, cb) {
  //     assert.equals(name, 'someview');
  //     cb(new Error('some error'));
  //   });
  //   jenkins.monitor({ view: 'someview', schedule: '*/30 * * * * *' }, function (err, result) {
  //     assert.equals(err.message, 'some error');
  //     done();
  //   });
  // });
  it("should monitor the latest build of a job when job opt is specified", function (done) {
    sinon.stub(cron.CronJob.prototype, "start").value(function () {
      done();
    });
    const jenkins = new Jenkins("http://localhost:8080");
    sinon.stub(Jenkins.prototype, "readJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      const result = { color: "blue" };
      cb(null, result);
    });
    jenkins.monitor(
      { job: "somejob", schedule: "*/30 * * * * *" },
      function (err, result) {
        assert.isNull(err);
        assert.equals(result, "ok");
      },
    );
  });
  // it('should pass error when an error occurs while monitoring a job').value(function (done) {
  //   sinon.stub(cron.CronJob.prototype, 'start').value(function () {
  //   });
  //   const jenkins = new Jenkins('http://localhost:8080');
  //   sinon.stub(Jenkins.prototype, 'readJob').value(function (name, cb) {
  //     assert.equals(name, 'somejob');
  //     cb(new Error('some error'));
  //   });
  //   jenkins.monitor({ job: 'somejob' }, function (err, result) {
  //     assert.equals(err.message, 'some error');
  //     done();
  //   });
  // });
});
