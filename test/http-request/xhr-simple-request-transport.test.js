import { fixture, assert, nextFrame, html } from '@open-wc/testing';
import sinon from 'sinon';
import { MockServer } from './server.js';
import '../../xhr-simple-request-transport.js';

/** @typedef {import('../../').XhrSimpleRequestTransportElement} XhrSimpleRequestTransportElement */

describe('<xhr-simple-request-transport>', () => {
  /**
   * @returns {Promise<XhrSimpleRequestTransportElement>}
   */
  async function basicFixture() {
    return (fixture(html`<xhr-simple-request-transport></xhr-simple-request-transport>`));
  }

  /**
   * @returns {Promise<XhrSimpleRequestTransportElement>}
   */
  async function proxyFixture() {
    return (fixture(html`
      <xhr-simple-request-transport proxy="https://api.domain.com/endpoint?url="></xhr-simple-request-transport>
    `));
  }

  /**
   * @returns {Promise<XhrSimpleRequestTransportElement>}
   */
  async function proxyEncodesFixture() {
    return (fixture(html`
      <xhr-simple-request-transport proxy="https://api.domain.com/endpoint?url=" proxyEncodeUrl></xhr-simple-request-transport>
    `));
  }

  /**
   * @returns {Promise<XhrSimpleRequestTransportElement>}
   */
  async function appendHeadersFixture() {
    return (fixture(html`
      <xhr-simple-request-transport appendHeaders="x-a: test1\nx-b: test2"></xhr-simple-request-transport>
    `));
  }

  if (navigator.userAgent.indexOf('windows') === -1){
    describe('_appendProxy()', () => {
    it('Transforms URL to add proxy', async () => {
      const element = await proxyFixture();
      const result = element._appendProxy('http://test.com');
      assert.equal(result, 'https://api.domain.com/endpoint?url=http://test.com');
    });

    it('URL value is encoded', async () => {
      const element = await proxyEncodesFixture();
      const result = element._appendProxy('http://test.com');
      assert.equal(result, 'https://api.domain.com/endpoint?url=http%3A%2F%2Ftest.com');
    });
    });

    describe('constructor()', () => {
      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('sets _xhr', () => {
        assert.ok(element._xhr);
      });

      it('sets null response', () => {
        assert.equal(element.response, null);
      });

      it('sets 0 status', () => {
        assert.equal(element.status, 0);
      });

      it('sets empty statusText', () => {
        assert.equal(element.statusText, '');
      });

      it('sets completes', () => {
        assert.ok(element.completes);
      });

      it('sets default aborted', () => {
        assert.isFalse(element.aborted);
      });

      it('sets error property', () => {
        assert.isFalse(element.error);
      });

      it('sets timedOut aborted', () => {
        assert.isFalse(element.timedOut);
      });

      it('sets resolveCompletes', async () => {
        await nextFrame();
        assert.ok(element.resolveCompletes);
      });

      it('sets rejectCompletes', async () => {
        await nextFrame();
        assert.ok(element.rejectCompletes);
      });
    });

    describe('send()', () => {
      let srv;
      before(() => {
        srv = new MockServer();
        srv.createServer();
      });

      after(() => {
        srv.restore();
      });

      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('makes a request', async () => {
        element.send({
          url: 'http://success.domain.com/',
          method: 'GET',
        });
        const result = await element.completes;
        assert.equal(result.response, 'test');
      });

      it('rejects when error', async () => {
        element.send({
          url: 'http://error.domain.com/404',
          method: 'GET',
        });
        let rejected = false;
        try {
          await element.completes;
        } catch (e) {
          rejected = true;
          assert.equal(e.error.message, 'The request failed with status code: 404');
        }
        assert.isTrue(rejected);
      });
    });

    describe('_computeAddHeaders()', () => {
      let srv;
      before(() => {
        srv = new MockServer();
        srv.createServer();
      });

      after(() => {
        srv.restore();
      });

      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      beforeEach(async () => {
        element = await appendHeadersFixture();
      });

      it('adds set headers', async () => {
        element.send({
          url: 'http://success.domain.com/headers',
          method: 'GET',
        });
        const result = await element.completes;
        const headers = JSON.parse(result.response);
        assert.equal(headers['x-a'], 'test1');
        assert.equal(headers['x-b'], 'test2');
      });

      it('adds request string headers', async () => {
        element.send({
          url: 'http://success.domain.com/headers',
          headers: 'accept: application/json\nx-test:true',
          method: 'GET',
        });
        const result = await element.completes;
        const headers = JSON.parse(result.response);
        assert.equal(headers['x-a'], 'test1');
        assert.equal(headers['x-b'], 'test2');
        assert.equal(headers.accept, 'application/json');
        assert.equal(headers['x-test'], 'true');
      });

      it('adds request headers', async () => {
        const requestHeaders = new Headers()
        requestHeaders.set('accept', 'application/json');
        element.send({
          url: 'http://success.domain.com/headers',
          // @ts-ignore
          headers: requestHeaders,
          method: 'GET',
        });
        const result = await element.completes;
        const headers = JSON.parse(result.response);
        assert.equal(headers.accept, 'application/json');
      });

      it('adds set headers only', async () => {
        element.send({
          url: 'http://success.domain.com/headers',
          headers: 'x-a: test3',
          method: 'GET',
        });
        const result = await element.completes;
        const headers = JSON.parse(result.response);
        assert.equal(headers['x-a'], 'test1');
        assert.equal(headers['x-b'], 'test2');
      });
    });

    describe('_errorHandler()', () => {
      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      let error;
      beforeEach(async () => {
        element = await basicFixture();
        error = new Error('test-error');
      });

      it('sets error property', () => {
        element.rejectCompletes = () => {};
        element._errorHandler(error);
        assert.isTrue(element.error);
      });

      it('calls _updateStatus()', () => {
        element.rejectCompletes = () => {};
        const spy = sinon.spy(element, '_updateStatus');
        element._errorHandler(error);
        assert.isTrue(spy.called);
      });

      it('calls collectHeaders()', () => {
        element.rejectCompletes = () => {};
        const spy = sinon.spy(element, 'collectHeaders');
        element._errorHandler(error);
        assert.isTrue(spy.called);
      });

      it('sets response headers', () => {
        element.rejectCompletes = () => {};
        // @ts-ignore
        element._xhr = {
          getAllResponseHeaders: () => 'test-headers'
        };
        element._errorHandler(error);
        assert.equal(element.headers, 'test-headers');
      });

      it('rejects the promise', async () => {
        element._errorHandler(error);
        let rejected = false;
        try {
          await element.completes;
        } catch (e) {
          rejected = true;
        }
        assert.isTrue(rejected);
      });

      it('ignores it when aborted', () => {
        element._aborted = true;
        const spy = sinon.spy(element, 'collectHeaders');
        element._errorHandler(error);
        assert.isFalse(spy.called);
      });
    });

    describe('_timeoutHandler()', () => {
      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      let error;
      beforeEach(async () => {
        element = await basicFixture();
        error = new Error('test-error');
      });

      it('sets timedOut', () => {
        element.rejectCompletes = () => {};
        element._timeoutHandler(error);
        assert.isTrue(element.timedOut);
      });

      it('calls _updateStatus()', () => {
        element.rejectCompletes = () => {};
        const spy = sinon.spy(element, '_updateStatus');
        element._timeoutHandler(error);
        assert.isTrue(spy.called);
      });

      it('rejects the promise', async () => {
        element._timeoutHandler(error);
        let rejected = false;
        try {
          await element.completes;
        } catch (e) {
          rejected = true;
        }
        assert.isTrue(rejected);
      });
    });

    describe('_abortHandler()', () => {
      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('sets aborted', () => {
        element.rejectCompletes = () => {};
        element._abortHandler();
        assert.isTrue(element.aborted);
      });

      it('calls _updateStatus()', () => {
        element.rejectCompletes = () => {};
        const spy = sinon.spy(element, '_updateStatus');
        element._abortHandler();
        assert.isTrue(spy.called);
      });

      it('rejects the promise', async () => {
        element._abortHandler();
        let rejected = false;
        try {
          await element.completes;
        } catch (e) {
          rejected = true;
        }
        assert.isTrue(rejected);
      });
    });

    describe('parseResponse()', () => {
      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });

      it('parses json', () => {
        // @ts-ignore
        element._xhr = {
          responseType: 'json',
          responseText: '{"test": true}'
        };
        const result = element.parseResponse();
        assert.deepEqual(result, {
          test: true
        });
      });
    });

    describe('constructor()', () => {
      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });
  
      it('sets _xhr', () => {
        assert.ok(element._xhr);
      });
  
      it('sets null response', () => {
        assert.equal(element.response, null);
      });
  
      it('sets 0 status', () => {
        assert.equal(element.status, 0);
      });
  
      it('sets empty statusText', () => {
        assert.equal(element.statusText, '');
      });
  
      it('sets completes', () => {
        assert.ok(element.completes);
      });
  
      it('sets default aborted', () => {
        assert.isFalse(element.aborted);
      });
  
      it('sets error property', () => {
        assert.isFalse(element.error);
      });
  
      it('sets timedOut aborted', () => {
        assert.isFalse(element.timedOut);
      });
  
      it('sets resolveCompletes', async () => {
        await nextFrame();
        assert.ok(element.resolveCompletes);
      });
  
      it('sets rejectCompletes', async () => {
        await nextFrame();
        assert.ok(element.rejectCompletes);
      });
    });
  
    describe('send()', () => {
      let srv;
      before(() => {
        srv = new MockServer();
        srv.createServer();
      });
  
      after(() => {
        srv.restore();
      });
  
      let element = /** @type XhrSimpleRequestTransportElement */ (null);
      beforeEach(async () => {
        element = await basicFixture();
      });
  
      it('makes a request', async () => {
        element.send({
          url: 'http://success.domain.com/',
          method: 'GET',
        });
        const result = await element.completes;
        assert.equal(result.response, 'test');
      });
  
      it('rejects when error', async () => {
        element.send({
          url: 'http://error.domain.com/404',
          method: 'GET',
        });
        let rejected = false;
        try {
          await element.completes;
        } catch (e) {
          rejected = true;
          assert.equal(e.error.message, 'The request failed with status code: 404');
        }
        assert.isTrue(rejected);
      });
    });

    describe('Multipart request', () => {
      let srv;
      before(() => {
        srv = new MockServer();
        srv.createServer();
      });
    
      describe('_errorHandler()', () => {
        let element = /** @type XhrSimpleRequestTransportElement */ (null);
        let error;
        beforeEach(async () => {
          element = await basicFixture();
          error = new Error('test-error');
        });
    
        it('sets error property', () => {
          element.rejectCompletes = () => {};
          element._errorHandler(error);
          assert.isTrue(element.error);
        });
    
        it('calls _updateStatus()', () => {
          element.rejectCompletes = () => {};
          const spy = sinon.spy(element, '_updateStatus');
          element._errorHandler(error);
          assert.isTrue(spy.called);
        });
    
        it('calls collectHeaders()', () => {
          element.rejectCompletes = () => {};
          const spy = sinon.spy(element, 'collectHeaders');
          element._errorHandler(error);
          assert.isTrue(spy.called);
        });
    
        it('sets response headers', () => {
          element.rejectCompletes = () => {};
          // @ts-ignore
          element._xhr = {
            getAllResponseHeaders: () => 'test-headers'
          };
          element._errorHandler(error);
          assert.equal(element.headers, 'test-headers');
        });
    
        it('rejects the promise', async () => {
          element._errorHandler(error);
          let rejected = false;
          try {
            await element.completes;
          } catch (e) {
            rejected = true;
          }
          assert.isTrue(rejected);
        });
    
        it('ignores it when aborted', () => {
          element._aborted = true;
          const spy = sinon.spy(element, 'collectHeaders');
          element._errorHandler(error);
          assert.isFalse(spy.called);
        });
      });
    
      describe('_timeoutHandler()', () => {
        let element = /** @type XhrSimpleRequestTransportElement */ (null);
        let error;
        beforeEach(async () => {
          element = await basicFixture();
          error = new Error('test-error');
        });
    
        it('sets timedOut', () => {
          element.rejectCompletes = () => {};
          element._timeoutHandler(error);
          assert.isTrue(element.timedOut);
        });
    
        it('calls _updateStatus()', () => {
          element.rejectCompletes = () => {};
          const spy = sinon.spy(element, '_updateStatus');
          element._timeoutHandler(error);
          assert.isTrue(spy.called);
        });
    
        it('rejects the promise', async () => {
          element._timeoutHandler(error);
          let rejected = false;
          try {
            await element.completes;
          } catch (e) {
            rejected = true;
          }
          assert.isTrue(rejected);
        });
      });
    
      describe('_abortHandler()', () => {
        let element = /** @type XhrSimpleRequestTransportElement */ (null);
        beforeEach(async () => {
          element = await basicFixture();
        });
    
        it('sets aborted', () => {
          element.rejectCompletes = () => {};
          element._abortHandler();
          assert.isTrue(element.aborted);
        });
    
        it('calls _updateStatus()', () => {
          element.rejectCompletes = () => {};
          const spy = sinon.spy(element, '_updateStatus');
          element._abortHandler();
          assert.isTrue(spy.called);
        });
    
        it('rejects the promise', async () => {
          element._abortHandler();
          let rejected = false;
          try {
            await element.completes;
          } catch (e) {
            rejected = true;
          }
          assert.isTrue(rejected);
        });
      });
    });

    describe('a11y', () => {
      it('adds aria-hidden attribute', async () => {
        const element = await basicFixture();
        assert.equal(element.getAttribute('aria-hidden'), 'true');
      });
    
      describe('Multipart request', () => {
        let srv;
        before(() => {
          srv = new MockServer();
          srv.createServer();
        });
    
        after(() => {
          srv.restore();
        });
    
        let element = /** @type XhrSimpleRequestTransportElement */ (null);
        beforeEach(async () => {
          element = await basicFixture();
        });
    
        it('removes content type header', async () => {
          const payload = new FormData();
          payload.append('test', new Blob(['test']));
          element.send({
            url: 'http://multipart.domain.com/',
            method: 'POST',
            headers: 'x-test: true\ncontent-type: multipart/form-data',
            payload
          });
          const result = await element.completes;
          const data = JSON.parse(result.response);
          assert.isUndefined(data.headers['content-type']);
        });
      });
    
      describe('a11y', () => {
        it('adds aria-hidden attribute', async () => {
          const element = await basicFixture();
          assert.equal(element.getAttribute('aria-hidden'), 'true');
        });
    
        it('respects existing aria-hidden attribute', async () => {
          const element = await fixture(`<xhr-simple-request-transport aria-hidden="true"></xhr-simple-request-transport>`);
          assert.equal(element.getAttribute('aria-hidden'), 'true');
        });
    
        it('is accessible', async () => {
          const element = await basicFixture();
          await assert.isAccessible(element);
        });
      });
    });
  }
});
