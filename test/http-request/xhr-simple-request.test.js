/* eslint-disable no-param-reassign */
import { fixture, assert, nextFrame, html } from '@open-wc/testing';
import { MockServer } from './server.js';
import '../../xhr-simple-request.js';
import { EventTypes } from '../../src/events/EventTypes.js';

/** @typedef {import('../../').XhrSimpleRequestElement} XhrSimpleRequestElement */

describe('<xhr-simple-request>', () => {
  /**
   * @returns {Promise<XhrSimpleRequestElement>}
   */
  async function basicFixture() {
    return (fixture(html`<xhr-simple-request></xhr-simple-request>`));
  }

  /**
   * @returns {Promise<XhrSimpleRequestElement>}
   */
  async function proxyFixture() {
    return (fixture(html`
      <xhr-simple-request proxy="https://api.domain.com/endpoint"></xhr-simple-request>
    `));
  }

  /**
   * @returns {Promise<XhrSimpleRequestElement>}
   */
  async function proxyEncodesFixture() {
    return (fixture(html`
      <xhr-simple-request proxy="https://api.domain.com/endpoint" proxyEncodeUrl></xhr-simple-request>
    `));
  }

  /**
   * @returns {Promise<XhrSimpleRequestElement>}
   */
  async function appendHeadersFixture() {
    return (fixture(html`
      <xhr-simple-request appendHeaders="x-a: test1\nx-b: test2"></xhr-simple-request>
    `));
  }

  describe('xhr-simple-request', () => {
    let lastId = 0;
    function fire(detail) {
      detail.id = `request${++lastId}`;
      const e = new CustomEvent(EventTypes.Request.apiRequest, {
        cancelable: true,
        bubbles: true,
        composed: true,
        detail,
      });
      document.body.dispatchEvent(e);
    }

    describe('Basics', () => {
      let srv;
      before(() => {
        srv = new MockServer();
        srv.createServer();
      });

      after(() => {
        srv.restore();
      });

      const API_ROOT = 'http://success.domain.com/';
      let element = /** @type XhrSimpleRequestElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Cancelled event is not handled', () => {
        document.body.addEventListener(EventTypes.Request.apiRequest, function clb(e) {
          document.body.removeEventListener(EventTypes.Request.apiRequest, clb);
          e.preventDefault();
        });
        const request = {
          url: API_ROOT,
          method: 'GET'
        };
        fire(request);
        assert.equal(element.activeRequests.size, 0);
      });

      it('Processes not cancelled event', (done) => {
        element.addEventListener(EventTypes.Request.apiResponse, function clb() {
          element.removeEventListener(EventTypes.Request.apiResponse, clb);
          done();
        });
        const request = {
          url: API_ROOT,
          method: 'GET'
        };
        fire(request);
        assert.equal(element.activeRequests.size, 1);
      });

      it('Reports aborted request', (done) => {
        element.addEventListener(EventTypes.Request.apiResponse, function clb(e) {
          element.removeEventListener(EventTypes.Request.apiResponse, clb);
          // @ts-ignore
          const { detail } = e;
          assert.equal(detail.id, `request${  lastId}`);
          assert.isTrue(detail.isError);
          assert.equal(detail.error.message, 'Request aborted');
          done();
        });
        const request = {
          url: API_ROOT,
          method: 'GET'
        };
        fire(request);
        setTimeout(() => {
          const e = new CustomEvent(EventTypes.Request.abortApiRequest, {
            cancelable: true,
            bubbles: true,
            composed: true,
            detail: {
              id: `request${  lastId}`
            }
          });
          document.body.dispatchEvent(e);
        }, 1);
      });
    });

    describe('Success requests', () => {
      let srv;
      before(() => {
        srv = new MockServer();
        srv.createServer();
      });

      after(() => {
        srv.restore();
      });

      const API_ROOT = 'http://success.domain.com/';
      let element = /** @type XhrSimpleRequestElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('Response contains all properties', (done) => {
        const request = {
          url: API_ROOT,
          method: 'GET'
        };
        fire(request);
        element.addEventListener(EventTypes.Request.apiResponse, function clb(e) {
          element.removeEventListener(EventTypes.Request.apiResponse, clb);
          // @ts-ignore
          const data = e.detail;
          assert.isFalse(data.isError, 'isError is set');
          assert.typeOf(data.loadingTime, 'number', 'loadingTime is set');
          assert.isTrue(data.request === request, 'passes request object');
          assert.typeOf(data.response, 'object', 'response is set');
          assert.isUndefined(data.error, 'error is undefined');
          assert.equal(data.id, `request${  lastId}`, 'id is set');
          done();
        });
      });

      it('Response object contains response', (done) => {
        const request = {
          url: API_ROOT,
          method: 'GET'
        };
        fire(request);
        element.addEventListener(EventTypes.Request.apiResponse, function clb(e) {
          element.removeEventListener(EventTypes.Request.apiResponse, clb);
          // @ts-ignore
          const data = e.detail.response;
          assert.equal(data.status, 200, 'status is set');
          assert.equal(data.statusText, 'OK', 'statusText is set');
          assert.typeOf(data.headers, 'string', 'headers is set');
          assert.typeOf(data.payload, 'string', 'payload is set');
          done();
        });
      });

      it('Reports JSON response', (done) => {
        const request = {
          url: `${API_ROOT  }json`,
          method: 'GET'
        };
        fire(request);
        element.addEventListener(EventTypes.Request.apiResponse, function clb(e) {
          element.removeEventListener(EventTypes.Request.apiResponse, clb);
          // @ts-ignore
          const data = e.detail.response;
          assert.equal(data.status, 200, 'status is set');
          assert.equal(data.statusText, 'OK', 'statusText is set');
          assert.typeOf(data.headers, 'string', 'headers is set');
          assert.equal(data.payload, '{"test":true}', 'payload is set');
          done();
        });
      });

      it('Reports XML response', (done) => {
        const request = {
          url: `${API_ROOT  }xml`,
          method: 'GET'
        };
        fire(request);
        element.addEventListener(EventTypes.Request.apiResponse, function clb(e) {
          element.removeEventListener(EventTypes.Request.apiResponse, clb);
          // @ts-ignore
          const data = e.detail.response;
          assert.equal(data.status, 200, 'status is set');
          assert.equal(data.statusText, 'OK', 'statusText is set');
          assert.typeOf(data.headers, 'string', 'headers is set');
          assert.equal(data.payload, '<test></test>', 'payload is set');
          done();
        });
      });

      it('Sends data with request', (done) => {
        const body = 'test-payload';
        const request = {
          url: `${API_ROOT  }post`,
          method: 'POST',
          payload: body,
          headers: 'Content-Type: plain/text'
        };
        fire(request);
        element.addEventListener(EventTypes.Request.apiResponse, function clb(e) {
          element.removeEventListener(EventTypes.Request.apiResponse, clb);
          // @ts-ignore
          const data = e.detail.response;
          assert.equal(data.payload, body, 'payload is set');
          done();
        });
      });

      it('Sends headers with request', (done) => {
        const request = {
          url: `${API_ROOT  }headers`,
          method: 'GET',
          headers: 'x-test: test\r\naccept: application/json'
        };
        fire(request);
        window.addEventListener(EventTypes.Request.apiResponse, function clb(e) {
          window.removeEventListener(EventTypes.Request.apiResponse, clb);
          // @ts-ignore
          const data = e.detail.response;
          assert.equal(data.payload,
            '{"x-test":"test","accept":"application/json","Content-Type":"text/plain;charset=utf-8"}',
            'headers is set');
          done();
        });
      });
    });

    describe('Proxy settings', () => {
      it('Passes proxy information to the transport object', async () => {
        const element = await proxyFixture();
        const request = element._createRequest();
        assert.equal(request.proxy, 'https://api.domain.com/endpoint');
      });

      it('proxy-encode-url is not set by default', async () => {
        const element = await proxyFixture();
        const request = element._createRequest();
        await nextFrame();
        assert.isUndefined(request.proxyEncodeUrl);
      });

      it('Passes proxy-encode-url to the transport object', async () => {
        const element = await proxyEncodesFixture();
        const request = element._createRequest();
        await nextFrame();
        assert.isTrue(request.proxyEncodeUrl);
      });
    });

    describe('"appendHeaders" property', () => {
      it('Passes appendHeaders information to the transport object', async () => {
        const element = await appendHeadersFixture();
        const request = element._createRequest();
        await nextFrame();
        assert.equal(request.appendHeaders, 'x-a: test1\nx-b: test2');
      });
    });
  });

  describe('a11y', () => {
    it('adds aria-hidden attribute', async () => {
      const element = await basicFixture();
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });

    it('respects existing aria-hidden attribute', async () => {
      const element = await fixture(`<xhr-simple-request aria-hidden="true"></xhr-simple-request>`);
      assert.equal(element.getAttribute('aria-hidden'), 'true');
    });

    it('is accessible', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });
  });
});
