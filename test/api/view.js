"use strict";
/* eslint no-unused-vars: 0 */
import view from '../../lib/api/view.js';
import referee from '@sinonjs/referee';
import RssParser from 'rss-parser';
import Swaggy from 'swaggy-jenkins';
import sinon from 'sinon';

const assert = referee.assert;

describe('api - view', function() {
  beforeEach(function (done) {
    view.url  = 'http://localhost:8080';
    view.opts = { handlers: {}, headers: { jenkinsCrumb: 'somecrumb' } };
    view.remoteAccessApi = new Swaggy.RemoteAccessApi();
    done();
  });
  afterEach(function (done) {
    delete view.opts;
    done();
  });
  it('create -should send request to API endpoint', function (done) {
    sinon.stub(view.remoteAccessApi, 'postCreateView').value(function (name, opts, cb) {
      assert.equals(name, 'someview');
      assert.equals(opts.body, '<xml>some config</xml>');
      assert.equals(opts.contentType, 'application/xml');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    view.create('someview', '<xml>some config</xml>', done);
  });
  it('read - should send request to API endpoint', function (done) {
    sinon.stub(view.remoteAccessApi, 'getView').value(function (name, cb) {
      assert.equals(name, 'someview');
      cb();
    });
    view.read('someview', done);
  });
  it('update - should send request to API endpoint', function (done) {
    sinon.stub(view.remoteAccessApi, 'postViewConfig').value(function (name, body, opts, cb) {
      assert.equals(name, 'someview');
      assert.equals(body, '<xml>some config</xml>');
      assert.equals(opts.jenkinsCrumb, 'somecrumb');
      cb();
    });
    view.update('someview', '<xml>some config</xml>', done);
  });
  it('fetchConfig - should send request to API endpoint', function (done) {
    sinon.stub(view.remoteAccessApi, 'getViewConfig').value(function (name, cb) {
      assert.equals(name, 'someview');
      cb();
    });
    view.fetchConfig('someview', done);
  });
  it('parseFeed - should parse feed from API endpoint', function (done) {
    sinon.stub(RssParser.prototype, 'parseURL').value(function (url, cb) {
      assert.equals(url, 'http://localhost:8080/view/someview/rssAll');
      cb();
    });
    view.parseFeed('someview', done);
  });
});
