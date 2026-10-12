"use strict";
/* eslint no-unused-vars: 0 */
import cli from "bagofcli";
import fs from "fs";
import Jenkins from "../../lib/jenkins.js";
import job from "../../lib/cli/job.js";
import referee from "@sinonjs/referee";
import sinon from "sinon";
const assert = referee.assert;
const refute = referee.refute;

describe("cli - job", function () {
  beforeEach(function (done) {
    this.mockConsole = sinon.mock(console);
    this.mockFs = sinon.mock(fs);
    this.mockProcess = sinon.mock(process);

    const jenkins = new Jenkins("http://localhost:8080");
    this.mockCb = function (command, cb) {
      // This jenkins constant is getting stubbed in the test functions
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
  it("create - should log job created success message", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was created successfully");
    this.mockFs
      .expects("readFileSync")
      .once()
      .withExactArgs("config.xml")
      .returns("<xml>some config</xml>");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon
      .stub(Jenkins.prototype, "createJob")
      .value(function (name, config, cb) {
        assert.equals(name, "somejob");
        assert.equals(config, "<xml>some config</xml>");
        cb();
      });

    job.create(this.mockCb)({ args: ["somejob", "config.xml"] });
  });
  it("read - should log job status with correct color and health reports", function () {
    const status = "ok".blue;
    this.mockConsole.expects("log").once().withExactArgs(`somejob | ${status}`);
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(" - %s", "somereport1");
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(" - %s", "somereport2");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "readJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      const result = {
        color: "blue",
        healthReport: [
          { description: "somereport1" },
          { description: "somereport2" },
        ],
      };
      cb(null, result);
    });

    job.read(this.mockCb)({ args: ["somejob"] });
  });
  it("read - should log status as-is in grey color when color is status value", function () {
    const status = "notbuilt".grey;
    this.mockConsole.expects("log").once().withExactArgs(`somejob | ${status}`);
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(" - %s", "somereport1");
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(" - %s", "somereport2");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "readJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      const result = {
        color: "notbuilt",
        healthReport: [
          { description: "somereport1" },
          { description: "somereport2" },
        ],
      };
      cb(null, result);
    });

    job.read(this.mockCb)({ args: ["somejob"] });
  });
  it("readLatest - should display yellow building status and start time description", function () {
    const status = "building".yellow;
    this.mockConsole.expects("log").once().withExactArgs(`somejob | ${status}`);
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(sinon.match(new RegExp(" - Started .* ago")));
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "readLatestJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      const result = {
        building: true,
        timestamp: 1422789191389,
      };
      cb(null, result);
    });

    job.readLatest(this.mockCb)({ args: ["somejob"] });
  });
  it("readLatest - should display completed status and finish time description", function () {
    const status = "success".green;
    this.mockConsole.expects("log").once().withExactArgs(`somejob | ${status}`);
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(sinon.match(new RegExp(" - Finished .* ago")));
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "readLatestJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      const result = {
        building: false,
        result: "SUCCESS",
        timestamp: 1422789191389,
        duration: 10,
      };
      cb(null, result);
    });

    job.readLatest(this.mockCb)({ args: ["somejob"] });
  });
  it("update - should log job updated success message", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was updated successfully");
    this.mockFs
      .expects("readFileSync")
      .once()
      .withExactArgs("config.xml")
      .returns("<xml>some config</xml>");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon
      .stub(Jenkins.prototype, "updateJob")
      .value(function (name, config, cb) {
        assert.equals(name, "somejob");
        assert.equals(config, "<xml>some config</xml>");
        cb();
      });

    job.update(this.mockCb)({ args: ["somejob", "config.xml"] });
  });
  it("delete - should log job deleted success message", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was deleted successfully");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "deleteJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      cb();
    });

    job.delete(this.mockCb)({ args: ["somejob"] });
  });
  it("build - should log job started success message with params", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was triggered successfully");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon
      .stub(Jenkins.prototype, "buildJob")
      .value(function (name, params, cb) {
        assert.equals(name, "somejob");
        assert.equals(params.param1, "value1");
        assert.equals(params.param2, "value2");
        assert.equals(params.param3, "value=3");
        cb();
      });

    job.build(this.mockCb)({
      args: ["somejob", "param1=value1&param2=value2&param3=value=3"],
    });
  });
  it("build - should stream console output when console is enabled and build has started", function () {
    const clock = sinon.useFakeTimers();
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was triggered successfully");

    sinon
      .stub(Jenkins.prototype, "buildJob")
      .value(function (name, params, cb) {
        assert.equals(name, "somejob");
        assert.equals(params, {});
        cb(null, null, { headers: { location: "somebuildurl" } });
      });

    const checkBuildStarted = sinon
      .stub(Jenkins.prototype, "checkBuildStarted")
      .callsFake(function (buildUrl, cb) {
        assert.equals(buildUrl, "somebuildurl");
        cb(true);
      });

    const pipe = sinon.spy();
    sinon
      .stub(Jenkins.prototype, "streamJobConsole")
      .value(function (name, buildNumber, interval, cb) {
        assert.equals(name, "somejob");
        assert.isUndefined(buildNumber);
        assert.equals(interval, 0);
        return { pipe: pipe };
      });

    job.build(this.mockCb)({ console: true, args: ["somejob"] });

    // build is only checked after the poll interval
    assert.equals(checkBuildStarted.callCount, 0);
    clock.tick(2000);
    assert.equals(checkBuildStarted.callCount, 1);
    assert.equals(pipe.callCount, 1);
    assert.equals(pipe.firstCall.args[1].end, false);
  });
  it("build - should wait until build starts before streaming console output", function () {
    const clock = sinon.useFakeTimers();
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was triggered successfully");
    this.mockConsole
      .expects("log")
      .twice()
      .withExactArgs("Waiting for job to start...");

    sinon
      .stub(Jenkins.prototype, "buildJob")
      .value(function (name, params, cb) {
        cb(null, null, { headers: { location: "somebuildurl" } });
      });

    let countdown = 3;
    const checkBuildStarted = sinon
      .stub(Jenkins.prototype, "checkBuildStarted")
      .callsFake(function (buildUrl, cb) {
        assert.equals(buildUrl, "somebuildurl");
        countdown -= 1;
        cb(countdown === 0);
      });

    const pipe = sinon.spy();
    sinon
      .stub(Jenkins.prototype, "streamJobConsole")
      .value(function (name, buildNumber, interval, cb) {
        assert.equals(name, "somejob");
        return { pipe: pipe };
      });

    job.build(this.mockCb)({ console: true, args: ["somejob"] });

    clock.tick(2000);
    clock.tick(2000);
    assert.equals(pipe.callCount, 0);
    clock.tick(2000);
    assert.equals(checkBuildStarted.callCount, 3);
    assert.equals(pipe.callCount, 1);
  });
  it("build - should give up after max retries and not stream console output", function () {
    const clock = sinon.useFakeTimers();
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was triggered successfully");
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Waiting for job to start...");
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "Build didn't start after 2 seconds, it's still waiting in the queue",
      );

    sinon
      .stub(Jenkins.prototype, "buildJob")
      .value(function (name, params, cb) {
        cb(null, null, { headers: { location: "somebuildurl" } });
      });

    sinon
      .stub(Jenkins.prototype, "checkBuildStarted")
      .callsFake(function (buildUrl, cb) {
        cb(false);
      });

    const streamJobConsole = sinon.stub(Jenkins.prototype, "streamJobConsole");
    const exit = sinon.stub(cli, "exit");

    job.build(this.mockCb)({ console: true, poll: 1, args: ["somejob"] });

    clock.tick(2000);
    clock.tick(2000);
    assert.equals(exit.callCount, 1);
    assert.equals(exit.firstCall.args, [{}, null]);
    assert.equals(streamJobConsole.callCount, 0);
  });
  it("build - should log job started success message with no command and no params", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was triggered successfully");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon
      .stub(Jenkins.prototype, "buildJob")
      .value(function (name, params, cb) {
        assert.equals(name, "somejob");
        cb();
      });

    job.build(this.mockCb)({ args: ["somejob"] });
  });
  it("stop - should log job stopped success message", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was stopped successfully");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "stopJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      cb();
    });

    job.stop(this.mockCb)({ args: ["somejob"] });
  });
  it("console - should pipe console output stream to stdout", function () {
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon
      .stub(Jenkins.prototype, "streamJobConsole")
      .value(function (name, buildNumber, interval, cb) {
        assert.equals(name, "somejob");
        assert.equals(buildNumber, 123);
        return {
          pipe: function (stream, opts) {
            refute.isUndefined(stream);
            assert.equals(opts.end, false);
            cb();
          },
        };
      });

    job.console(this.mockCb)({ args: ["somejob", 123] });
  });
  it("console - should pass undefined build number when none supplied", function () {
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon
      .stub(Jenkins.prototype, "streamJobConsole")
      .value(function (name, buildNumber, interval, cb) {
        assert.equals(name, "somejob");
        assert.isUndefined(buildNumber);
        return {
          pipe: function (stream, opts) {
            refute.isUndefined(stream);
            assert.equals(opts.end, false);
            cb();
          },
        };
      });

    job.console(this.mockCb)({ args: ["somejob"] });
  });
  it("enable - should log job enabled success message", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was enabled successfully");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "enableJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      cb();
    });

    job.enable(this.mockCb)({ args: ["somejob"] });
  });
  it("disable - should log job disabled success message", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job somejob was disabled successfully");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "disableJob").value(function (name, cb) {
      assert.equals(name, "somejob");
      cb();
    });

    job.disable(this.mockCb)({ args: ["somejob"] });
  });
  it("copy - should log job copy success message", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Job existingjob was copied to job newjob");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon
      .stub(Jenkins.prototype, "copyJob")
      .value(function (existingName, newName, cb) {
        assert.equals(existingName, "existingjob");
        assert.equals(newName, "newjob");
        cb();
      });

    job.copy(this.mockCb)({ args: ["existingjob", "newjob"] });
  });
  it("fetchConfig - should log configuration", function () {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("<xml>some config</xml>");
    this.mockProcess.expects("exit").once().withExactArgs(0);

    sinon.stub(Jenkins.prototype, "fetchJobConfig").value(function (name, cb) {
      assert.equals(name, "somejob");
      cb(null, "<xml>some config</xml>");
    });

    job.fetchConfig(this.mockCb)({ args: ["somejob"] });
  });
});
