var bag = require('bagofholding'),
  sandbox = require('sandboxed-module'),
  should = require('should'),
  checks, mocks,
  util = require('../lib/util');

describe('util', function () {

  function create(checks, mocks) {
    return sandbox.require('../lib/util', {
      requires: mocks ? mocks.requires : {},
      globals: {}
    });
  }

  beforeEach(function () {
    checks = {};
    mocks = {};
  });

  describe('status', function () {

    it('should display status from known color', function () {
      util.status('blue').should.equal('OK');
      util.status('green').should.equal('OK');
      util.status('grey').should.equal('ABORTED');
      util.status('red').should.equal('FAIL');
      util.status('yellow').should.equal('WARN');
    });

    it('should display status on actively running job', function () {
      util.status('red_anime').should.equal('FAIL');
    });

    it('should uppercase unknown color as a status', function () {
      util.status('disabled').should.equal('DISABLED');
    });
  });
});
 