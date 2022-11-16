/* eslint-disable no-param-reassign */
import { fixture, assert, html, nextFrame, aTimeout } from '@open-wc/testing';
import * as sinon from 'sinon';
import { ApiViewModel } from '@api-components/api-forms'
import { AmfLoader } from './amf-loader.js';
import '../api-request-editor.js';

/** @typedef {import('..').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  /**
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function basicFixture() {
    return (fixture(html`<api-request-editor></api-request-editor>`));
  }

  /**
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function allowCustomFixture() {
    return (fixture(html`<api-request-editor allowCustom></api-request-editor>`));
  }

  /**
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function modelFixture(amf, selected) {
    return (fixture(html`<api-request-editor
      .amf="${amf}"
      .selected="${selected}"></api-request-editor>`));
  }

  /**
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function urlLabelFixture(amf, selected) {
    return (fixture(html`<api-request-editor
      .amf="${amf}"
      .selected="${selected}"
      urlLabel></api-request-editor>`));
  }

  /**
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function customBaseUriSlotFixture() {
    return (fixture(html`
      <api-request-editor>
        <anypoint-item slot="custom-base-uri" value="http://customServer.com">Custom</anypoint-item>
      </api-request-editor>`));
  }

  /**
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function noSelectorFixture() {
    return (fixture(html`
      <api-request-editor noServerSelector>
        <anypoint-item slot="custom-base-uri" value="http://customServer.com">http://customServer.com</anypoint-item>
      </api-request-editor>`));
  }

  function clearCache() {
    const transformer = new ApiViewModel();
    transformer.clearCache();
  }

  describe('initialization', () => {
    it('can be initialized with document.createElement', () => {
      const element = document.createElement('api-request-editor');
      assert.ok(element);
    });

    it('renders url editor without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.url-editor');
      assert.isFalse(node.hasAttribute('hidden'));
    });

    it('renders send button without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.send-button');
      assert.ok(node);
    });

    it('send button has "send" label', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.send-button');
      assert.equal(node.textContent.trim(), 'Send');
    });

    it('hides headers editor without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('api-headers-editor').parentElement;
      assert.isTrue(node.hasAttribute('hidden'));
    });

    it('does not render payload editor without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('api-body-editor');
      assert.notOk(node);
    });

    it('does not render authorization editor without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('api-authorization');
      assert.notOk(node);
    });

    it('does not render url label', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.url-label');
      assert.notOk(node);
    });
  });

  describe('allows custom property', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await allowCustomFixture();
    });

    it('renders query editor', async () => {
      const node = element.shadowRoot.querySelector('api-url-params-editor').parentElement;
      assert.isFalse(node.hasAttribute('hidden'));
    });

    it('should not remove custom query parameters after changing `serverValue`', () => {
      element._queryModel = [
        {
          name: 'testName',
          value: 'test value',
          enabled: true,
          schema: {
            isCustom: true
          }
        }
      ]
      element.serverValue = 'alternate server value'
      assert.lengthOf(element._queryModel, 1)
    })
  });

  describe('oauth2-redirect-uri-changed', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('sets redirectUri from the event', () => {
      const value = 'https://auth.domain.com';
      document.body.dispatchEvent(new CustomEvent('oauth2-redirect-uri-changed', {
        bubbles: true,
        detail: {
          value
        }
      }));

      assert.equal(element.redirectUri, value);
    });
  });

  describe('_computeIsPayloadRequest()', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await allowCustomFixture();
    });

    it('Returns false for GET', () => {
      const result = element._computeIsPayloadRequest('get');
      assert.isFalse(result);
    });

    it('Returns false for HEAD', () => {
      const result = element._computeIsPayloadRequest('head');
      assert.isFalse(result);
    });

    it('Returns true for other inputs', () => {
      const result = element._computeIsPayloadRequest('post');
      assert.isTrue(result);
    });
  });

  describe('_dispatch()', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await allowCustomFixture();
    });
    const eName = 'test-event';
    const eDetail = 'test-detail';

    it('Dispatches an event', () => {
      const spy = sinon.spy();
      element.addEventListener(eName, spy);
      element._dispatch(eName);
      assert.isTrue(spy.called);
    });

    it('Returns the event', () => {
      const e = element._dispatch(eName);
      assert.typeOf(e, 'customevent');
    });

    it('Event is cancelable by default', () => {
      const e = element._dispatch(eName);
      assert.isTrue(e.cancelable);
    });

    it('Event is composed', () => {
      const e = element._dispatch(eName);
      if (typeof e.composed !== 'undefined') {
        assert.isTrue(e.composed);
      }
    });

    it('Event bubbles', () => {
      const e = element._dispatch(eName);
      assert.isTrue(e.bubbles);
    });

    it('Event is not cancelable when set', () => {
      const e = element._dispatch(eName, eDetail, false);
      assert.isFalse(e.cancelable);
    });

    it('Event has detail', () => {
      const e = element._dispatch(eName, eDetail);
      assert.equal(e.detail, eDetail);
    });
  });

  describe('clearRequest()', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
      element.url = 'https://api.com';
      element._headers = 'x-test: true';
      element._payload = 'test-payload';
    });

    it('Clears the URL', () => {
      element.clearRequest();
      assert.equal(element.url, '');
    });

    it('Clears headers', () => {
      element.clearRequest();
      assert.equal(element.headers, '');
    });

    it('Clears payload', () => {
      element.clearRequest();
      assert.equal(element.payload, '');
    });
  });

  describe('_responseHandler()', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    const requestId = 'test-id';
    beforeEach(async () => {
      clearCache();
      element = await basicFixture();
      element._loadingRequest = true;
      element._requestId = requestId;
    });

    it('Does nothing when ID is different', () => {
      const e = new CustomEvent('api-response', {
        detail: {
          id: 'otherId',
        }
      });
      element._responseHandler(e);
      assert.isTrue(element.loadingRequest);
    });

    it('Does nothing when no detail', () => {
      const e = new CustomEvent('api-response');
      element._responseHandler(e);
      assert.isTrue(element.loadingRequest);
    });

    it('resets the loadingRequest property', () => {
      const e = new CustomEvent('api-response', {
        detail: {
          id: requestId,
        }
      });
      element._responseHandler(e);
      assert.isFalse(element.loadingRequest);
    });

    it('Event handler is connected', () => {
      document.body.dispatchEvent(new CustomEvent('api-response', {
        bubbles: true,
        detail: {
          id: requestId
        }
      }));
      assert.isFalse(element.loadingRequest);
    });
  });

  [
    ['Compact model', true],
    ['Full model', false]
  ].forEach(([label, compact]) => {
    describe(`${label}`, () => {
      const httpbinApi = 'httpbin';
      const driveApi = 'google-drive-api';
      const demoApi = 'demo-api';

      describe('http method computation', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: httpbinApi, compact });
        });

        it('sets _httpMethod property (get)', async () => {
          const method = AmfLoader.lookupOperation(amf, '/anything', 'get');
          const element = await modelFixture(amf, method['@id']);
          assert.equal(element.httpMethod, 'get');
        });

        it('sets _httpMethod property (post)', async () => {
          const method = AmfLoader.lookupOperation(amf, '/anything', 'post');
          const element = await modelFixture(amf, method['@id']);
          assert.equal(element.httpMethod, 'post');
        });

        it('sets _httpMethod property (put)', async () => {
          const method = AmfLoader.lookupOperation(amf, '/anything', 'put');
          const element = await modelFixture(amf, method['@id']);
          assert.equal(element.httpMethod, 'put');
        });

        it('sets _httpMethod property (delete)', async () => {
          const method = AmfLoader.lookupOperation(amf, '/anything', 'delete');
          const element = await modelFixture(amf, method['@id']);
          assert.equal(element.httpMethod, 'delete');
        });
      });

      describe('_computeApiPayload() and _apiPayload', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: driveApi, compact });
        });

        it('returns undefined when no model', async () => {
          const element = await basicFixture();
          assert.isUndefined(element._computeApiPayload());
        });

        it('returns undefined when no "expects"', async () => {
          const element = await basicFixture();
          element.amf = amf;
          assert.isUndefined(element._computeApiPayload({}));
        });

        it('returns payload definition', async () => {
          const method = AmfLoader.lookupOperation(amf, '/files/{fileId}', 'patch');
          const element = await basicFixture();
          element.amf = amf;
          assert.typeOf(element._computeApiPayload(method), 'array');
        });

        it('sets _apiPayload when selection changed', async () => {
          const method = AmfLoader.lookupOperation(amf, '/files/{fileId}', 'patch');
          const element = await modelFixture(amf, method['@id']);
          assert.typeOf(element.apiPayload, 'array');
        });
      });

      describe('_isPayloadRequest', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: driveApi, compact });
        });

        it('is false for get request', async () => {
          const method = AmfLoader.lookupOperation(amf, '/files/{fileId}', 'get');
          const element = await modelFixture(amf, method['@id']);
          assert.isFalse(element.isPayloadRequest);
        });

        it('returns true for post request', async () => {
          const method = AmfLoader.lookupOperation(amf, '/files/{fileId}', 'patch');
          const element = await modelFixture(amf, method['@id']);
          assert.isTrue(element.isPayloadRequest);
        });
      });

      describe('_computeSecuredBy() and _securedBy', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: driveApi, compact });
        });

        it('returns undefined when no model', async () => {
          const element = await basicFixture();
          element.amf = amf;
          assert.isUndefined(element._computeSecuredBy());
        });

        it('returns undefined when no security model', async () => {
          const element = await basicFixture();
          element.amf = amf;
          assert.isUndefined(element._computeSecuredBy({}));
        });

        it('returns security scheme model', async () => {
          const method = AmfLoader.lookupOperation(amf, '/files', 'get');
          const element = await modelFixture(amf, method['@id']);
          const security = element._computeSecuredBy(method);
          assert.typeOf(security, 'array');
        });

        it('sets securedBy', async () => {
          const method = AmfLoader.lookupOperation(amf, '/files', 'get');
          const element = await modelFixture(amf, method['@id']);
          assert.typeOf(element.securedBy, 'array');
          assert.lengthOf(element.securedBy, 1);
        });
      });

      describe('_computeHeaders() and _apiHeaders', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        it('returns undefined when no model', async () => {
          const element = await basicFixture();
          element.amf = amf;
          assert.isUndefined(element._computeHeaders());
        });

        it('returns undefined when no security model', async () => {
          const element = await basicFixture();
          element.amf = amf;
          assert.isUndefined(element._computeHeaders({}));
        });

        it('returns headers model', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          const security = element._computeHeaders(method);
          assert.typeOf(security, 'array');
        });

        it('sets _apiHeaders', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          assert.typeOf(element.apiHeaders, 'array');
          assert.lengthOf(element.apiHeaders, 1);
        });
      });

      describe('#contentType', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        it('sets content type from the body', async () => {
          const method = AmfLoader.lookupOperation(amf, '/content-type', 'post');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(100);
          await nextFrame();
          assert.equal(element.contentType, 'application/json');
        });
      });

      describe('ui state', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        it('renders authorization panel when authorization is required', async () => {
          const method = AmfLoader.lookupOperation(amf, '/messages', 'get');
          const element = await modelFixture(amf, method['@id']);
          const node = element.shadowRoot.querySelector('api-authorization');
          assert.ok(node);
        });

        it('renders query/uri editor when model is set', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          const node = element.shadowRoot.querySelector('api-url-params-editor').parentElement;
          assert.isFalse(node.hasAttribute('hidden'));
        });

        it('renders headers editor when model is set', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          const node = element.shadowRoot.querySelector('api-headers-editor').parentElement;
          assert.isFalse(node.hasAttribute('hidden'));
        });

        it('hides URL editor when noUrlEditor', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          element.noUrlEditor = true;
          await nextFrame();
          const node = element.shadowRoot.querySelector('.url-editor');
          assert.isTrue(node.hasAttribute('hidden'));
        });

        it('computes URL when URL editor is hidden', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          element.noUrlEditor = true;
          await nextFrame();
          assert.equal(element.url, 'http://production.domain.com/people');
        });
      });

      describe('execute()', () => {
        let amf;
        let element = /** @type ApiRequestEditorElement */ (null);
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        beforeEach(async () => {
          clearCache();
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          element = await modelFixture(amf, method['@id']);
        });

        it('Dispatches `api-request` event', () => {
          const spy = sinon.spy();
          element.addEventListener('api-request', spy);
          element.execute();
          assert.isTrue(spy.called);
        });

        it('Sets loadingRequest property', () => {
          element.execute();
          assert.isTrue(element.loadingRequest);
        });

        it('Sets requestId property', () => {
          element.execute();
          assert.typeOf(element.requestId, 'string');
        });

        it('Calls serializeRequest()', () => {
          const spy = sinon.spy(element, 'serializeRequest');
          element.execute();
          assert.isTrue(spy.called);
        });

        it('Calls _dispatch()', () => {
          const spy = sinon.spy(element, '_dispatch');
          element.execute();
          assert.isTrue(spy.called);
        });

        it('_dispatch() is called with event name', () => {
          const spy = sinon.spy(element, '_dispatch');
          element.execute();
          assert.equal(spy.args[0][0], 'api-request');
        });

        it('_dispatch() is called with serialized request', () => {
          const spy = sinon.spy(element, '_dispatch');
          const clock = sinon.useFakeTimers(Date.now());

          element.execute();
          const compare = element.serializeRequest();
          compare.id = element.requestId;

          assert.deepEqual(spy.args[0][1], compare);
          clock.restore();
        });
      });

      describe('abort()', () => {
        let amf;
        let element = /** @type ApiRequestEditorElement */ (null);
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        beforeEach(async () => {
          clearCache();
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          element = await modelFixture(amf, method['@id']);
          element._loadingRequest = true;
          element._requestId = 'test-request';
          await nextFrame();
        });

        it('Fires when abort button pressed', () => {
          const spy = sinon.spy();
          element.addEventListener('abort-api-request', spy);
          const button = /** @type HTMLElement */ (element.shadowRoot.querySelector('.send-button.abort'));
          button.click();
          assert.isTrue(spy.calledOnce);
        });

        it('Event contains the URL and the ID', (done) => {
          element.addEventListener('abort-api-request', function clb(e) {
            element.removeEventListener('abort-api-request', clb);
            // @ts-ignore
            const { detail } = e;
            assert.equal(detail.url, 'http://production.domain.com/people', 'URL is set');
            assert.equal(detail.id, 'test-request', 'id is set');
            done();
          });
          element.abort();
        });

        it('Resets loadingRequest property', () => {
          element.abort();
          assert.isFalse(element.loadingRequest);
        });

        it('Resets requestId property', () => {
          element.abort();
          assert.isUndefined(element.requestId);
        });
      });

      describe('serializeRequest()', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        beforeEach(async () => {
          clearCache();
        });

        it('Returns an object', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          const result = element.serializeRequest();
          assert.typeOf(result, 'object');
        });

        it('Sets editor url', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          await nextFrame();
          const result = element.serializeRequest();
          assert.equal(result.url, 'http://production.domain.com/people');
        });

        it('Sets editor method', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          const result = element.serializeRequest();
          assert.equal(result.method, 'GET');
        });

        it('Sets headers from the editor', async () => {
          const method = AmfLoader.lookupOperation(amf, '/post-headers', 'post');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.equal(result.headers, 'x-string: my-value\ncontent-type: application/json');
        });

        it('sets editor payload', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'post');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.ok(result.payload);
          assert.equal(result.payload, element.payload);
        });

        it('sets auth data', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people/{personId}', 'get');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.typeOf(result.auth, 'array');
          assert.lengthOf(result.auth, 1);
          assert.equal(result.auth[0].type, 'custom');
        });

        it('does not set editor payload when GET request', async () => {
          const postMethod = AmfLoader.lookupOperation(amf, '/people', 'post');
          const element = await modelFixture(amf, postMethod['@id']);
          await aTimeout(0);
          const getMethod = AmfLoader.lookupOperation(amf, '/people', 'get');
          element.selected = getMethod['@id'];
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.isUndefined(result.payload);
        });

        it('does not set editor payload when HEAD request', async () => {
          const postMethod = AmfLoader.lookupOperation(amf, '/people', 'post');
          const element = await modelFixture(amf, postMethod['@id']);
          await aTimeout(0);
          const getMethod = AmfLoader.lookupOperation(amf, '/people', 'head');
          element.selected = getMethod['@id'];
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.isUndefined(result.payload);
        });

        it('sets Content-Type header if not present but set in component', async () => {
          const element = await basicFixture();
          element._headerContentType = 'application/json';
          element._headers = '';
          const result = element.serializeRequest();
          assert.equal(result.headers, 'content-type: application/json');
        });
      });

      describe('_sendHandler()', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        // it('calls authAndExecute() when authorization is required', async () => {
        //   const method = AmfLoader.lookupOperation(amf, '/messages', 'get');
        //   const element = await modelFixture(amf, method['@id']);
        //   await aTimeout(5);
        //   const spy = sinon.spy(element, 'authAndExecute');
        //   const button = element.shadowRoot.querySelector('.send-button');
        //   /** @type HTMLElement */ (button).click();
        //   await aTimeout(25);
        //   assert.isTrue(spy.called);
        // });

        it('calls execute() when authorization is not required', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await modelFixture(amf, method['@id']);
          await aTimeout(5);
          const spy = sinon.spy(element, 'execute');
          const button = element.shadowRoot.querySelector('.send-button');
          /** @type HTMLElement */ (button).click();
          assert.isTrue(spy.called);
        });
      });

      describe('#urlLabel', () => {
        let amf;
        before(async () => {
          amf = await AmfLoader.load({ fileName: demoApi, compact });
        });

        it('renders the url label', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await urlLabelFixture(amf, method['@id']);
          const node = element.shadowRoot.querySelector('.url-label');
          assert.ok(node);
        });

        it('renders the url value', async () => {
          const method = AmfLoader.lookupOperation(amf, '/people', 'get');
          const element = await urlLabelFixture(amf, method['@id']);
          await nextFrame();
          const node = element.shadowRoot.querySelector('.url-label');
          const text = node.textContent.trim();
          assert.equal(text, 'http://production.domain.com/people');
        });
      });

      describe('slotted servers', () => {
        let element = /** @type ApiRequestEditorElement */ (null);
        let amf;

        beforeEach(async () => {
          element = await customBaseUriSlotFixture();
          amf = await AmfLoader.load({ compact });
          element.amf = amf;
          const op = AmfLoader.lookupOperation(amf, '/people', 'get')
          element.selected = op['@id'];
          await aTimeout(0);
        });

        it('should update api-url-editor value after selecting slotted base uri', async () => {
          element._serverHandler(new CustomEvent('apiserverchanged', { detail: { value: 'http://customServer.com', type: 'uri' } }));
          await aTimeout(0);
          assert.equal(element.shadowRoot.querySelector('api-url-editor').value, 'http://customServer.com/people');
        });
      })
    });
  });

  // AMF 4 breaking changes the model and I have no way (?) of generating partial model.
  describe.skip('Partial model', () => {
    /**
     * @returns {Promise<ApiRequestEditorElement>}
     */  
    async function partialFixture(amf, selected, server, protocols, version) {
      return fixture(html`<api-request-editor
        .amf="${amf}"
        .selected="${selected}"
        .server="${server}"
        .protocols="${protocols}"
        .version="${version}"></api-request-editor>`);
    }

    let amf;
    let server;
    let scheme;
    let version;
    before(async () => {
      const summary = await AmfLoader.load({ fileName: 'partial-model/summary' });
      const endpoint = await AmfLoader.load({ fileName: 'partial-model/endpoint' });
      server = summary['doc:encodes']['http:server'];
      scheme = [summary['doc:encodes']['http:scheme']];
      version = summary['doc:encodes']['schema-org:version'];
      amf = endpoint;
    });

    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      clearCache();
      element = await partialFixture(amf, '#69', server, scheme, version);
      await aTimeout(50); // 50 for slower browsers
    });

    it('url is computed', () => {
      assert.equal(element.url, 'http://petstore.swagger.io/v2/api/user?stringParameter=');
    });

    it('queryModel is computed', () => {
      assert.lengthOf(element._queryModel, 7);
    });
  });

  describe('#allowCustomBaseUri', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await customBaseUriSlotFixture();
    });

    it('has 1 server by default', () => {
      assert.equal(element.serversCount, 1);
    });

    it('hides server selector with a single server', async () => {
      assert.isTrue(element._serverSelectorHidden);
    });

    it('sets hidden attribute to server selector', async () => {
      const serverSelector = element.shadowRoot.querySelector('api-server-selector');
      assert.exists(serverSelector);
      assert.isTrue(serverSelector.hasAttribute('hidden'));
    });

    it('should have 2 servers', async () => {
      element.allowCustomBaseUri = true;
      await nextFrame();
      assert.equal(element.serversCount, 2);
    });

    it('should not hide server selector', async () => {
      element.allowCustomBaseUri = true;
      await nextFrame();
      assert.isFalse(element._serverSelectorHidden);
    })

    it('should set hidden attribute to false in server selector', async () => {
      element.allowCustomBaseUri = true;
      await nextFrame();
      const serverSelector = element.shadowRoot.querySelector('api-server-selector')
      assert.exists(serverSelector);
      assert.isFalse(serverSelector.hasAttribute('hidden'));
    });
  });

  describe('#noServerSelector', () => {
    it('hides server selector', async () => {
      const element = await noSelectorFixture();
      assert.isTrue(element._serverSelectorHidden);
    });

    it('should set hidden attribute to server selector', async () => {
      const element = await noSelectorFixture();
      const serverSelector = element.shadowRoot.querySelector('api-server-selector');
      assert.exists(serverSelector);
      assert.isTrue(serverSelector.hasAttribute('hidden'));
    });

    it('renders server selector at first', async () => {
      const element = await customBaseUriSlotFixture();
      element.allowCustomBaseUri = true;
      await nextFrame();
      assert.isFalse(element._serverSelectorHidden);
    });

    it('renders server selector at first', async () => {
      const element = await customBaseUriSlotFixture();
      element.allowCustomBaseUri = true;
      await nextFrame();
      element.noServerSelector = true
      await nextFrame()
      assert.isTrue(element._serverSelectorHidden);
      const serverSelector = element.shadowRoot.querySelector('api-server-selector');
      assert.exists(serverSelector);
      assert.isTrue(serverSelector.hasAttribute('hidden'));
    });
  });

  [
    ['Compact model', true],
    ['Regular model', false]
  ].forEach(([label, compact]) => {
    const multiServerApi = 'multi-server';

    /**
     * @param {HTMLElement} element
     * @param {String} value
     * @param {String} type
     */
    function dispatchSelectionEvent(element, value, type) {
      const e = {
        detail: {
          value,
          type,
        },
      };
      const node = element.shadowRoot.querySelector('api-server-selector');
      node.dispatchEvent(new CustomEvent('apiserverchanged', e));
    }

    /**
     * @param {Object} element
     * @param {String} selected
     */
    function changeSelection(element, selected) {
      element.selected = selected;
    }

    describe(`server selection - ${label}`, () => {
      describe('custom URI selection', () => {
        let element = /** @type ApiRequestEditorElement */ (null);
        let amf;
        beforeEach(async () => {
          amf = await AmfLoader.load({ fileName: multiServerApi, compact });
          element = await modelFixture(amf);
          // This is equivalent to Custom URI being selected, and 'https://www.google.com' being input
          dispatchSelectionEvent(element, 'https://www.google.com', 'custom');
        });

        it('has servers computed', () => {
          assert.lengthOf(element.servers, 4);
        });

        it('updates serverValue', () => {
          assert.equal(element.serverValue, 'https://www.google.com');
        });

        it('renders selector for custom URI', () => {
          assert.exists(element.shadowRoot.querySelector('api-server-selector'));
        });

        it('sets effectiveBaseUri to baseUri value', () => {
          element.baseUri = 'https://example.org';
          assert.equal(element.effectiveBaseUri, element.baseUri);
          assert.equal(element.effectiveBaseUri, 'https://example.org');
        });

        it('sets effectiveBaseUri serverValue value', () => {
          assert.equal(element.effectiveBaseUri, element.serverValue);
          assert.equal(element.effectiveBaseUri, 'https://www.google.com');
        });

        it('updates computed server', async () => {
          dispatchSelectionEvent(element, 'https://{customerId}.saas-app.com:{port}/v2', 'server');
          await nextFrame();
          assert.isDefined(element.server);
        });
      });

      describe('from navigation events', () => {
        let amf;
        let element = /** @type ApiRequestEditorElement */ (null);

        before(async () => {
          amf = await AmfLoader.load({ fileName: multiServerApi, compact });
        });

        beforeEach(async () => {
          element = await modelFixture(amf);
        });

        it('has default number of servers', async () => {
          assert.lengthOf(element.servers, 4);
        });

        it('computes servers when first navigation', async () => {
          const method = AmfLoader.lookupOperation(amf, '/default', 'get');
          changeSelection(element, method['@id']);
          await nextFrame();
          assert.lengthOf(element.servers, 4);
        });

        it('computes servers after subsequent navigation', async () => {
          // default navigation
          changeSelection(element, AmfLoader.lookupOperation(amf, '/default', 'get')['@id']);
          await nextFrame();
          // other endpoint
          changeSelection(element, AmfLoader.lookupOperation(amf, '/files', 'get')['@id']);
          await nextFrame();
          assert.lengthOf(element.servers, 1);
        });

        it('automatically selects first available server', async () => {
          changeSelection(element, AmfLoader.lookupOperation(amf, '/default', 'get')['@id']);
          await nextFrame();
          assert.equal(element.serverValue, 'https://{customerId}.saas-app.com:{port}/v2');
        });

        it('auto change selected server', async () => {
          changeSelection(element, AmfLoader.lookupOperation(amf, '/default', 'get')['@id']);
          await nextFrame();
          changeSelection(element, AmfLoader.lookupOperation(amf, '/files', 'get')['@id']);
          await nextFrame();
          assert.equal(element.serverValue, 'https://files.example.com');
        });

        it('keeps server selection when possible', async () => {
          changeSelection(element, AmfLoader.lookupOperation(amf, '/default', 'get')['@id']);
          await nextFrame();

          dispatchSelectionEvent(element, 'https://{region}.api.cognitive.microsoft.com', 'server');

          changeSelection(element, AmfLoader.lookupOperation(amf, '/copy', 'get')['@id']);
          await nextFrame();
          assert.equal(element.serverValue, 'https://{region}.api.cognitive.microsoft.com');
        });

        it('initializes with selected server', async () => {
          const methodId = AmfLoader.lookupOperation(amf, '/ping', 'get')['@id'];
          element = await modelFixture(amf, methodId);
          await nextFrame();
          assert.lengthOf(element.servers, 2);
        });
      });
    });
  });

  describe('serializeRequest()', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
      element._httpMethod = 'POST';
      element.url = 'some-url';
    });

    it('should remove multipart content type if form data payload', () => {
      element._headers = 'content-type: multipart/form-data';
      element._payload = new FormData()
      const request = element.serializeRequest()

      assert.equal(request.headers, '');
    });

    it('should not modify headers if content type not defined and form data payload', () => {
      element._headers = '';
      element._payload = new FormData()
      const request = element.serializeRequest()

      assert.equal(request.headers, '');
    });
  });

  describe('allowHideOptional', () => {
    let element

    beforeEach(async () => {
      element = await basicFixture();
    });

    it('should pass down value to api-url-params-editor', async () => {
      element.allowHideOptional = true;
      await nextFrame();
      assert.isTrue(element.shadowRoot.querySelector('api-url-params-editor').allowHideOptional);
    });
  });

  describe('allowDisableParams', () => {
    let element

    beforeEach(async () => {
      element = await basicFixture();
    });

    it('should pass down value to api-url-params-editor', async () => {
      element.allowDisableParams = true;
      await nextFrame();
      assert.isTrue(element.shadowRoot.querySelector('api-url-params-editor').allowDisableParams);
    });
  });

  describe('Persisting cache', () => {
    it('should not clear cache without AMF change', async () => {
      const clearCacheSpy = sinon.spy();
      ApiViewModel.prototype.clearCache = clearCacheSpy
      await basicFixture();
      await nextFrame();
      assert.isFalse(clearCacheSpy.called);
    });

    it('should clear cache after AMF change', async () => {
      const clearCacheSpy = sinon.spy();
      ApiViewModel.prototype.clearCache = clearCacheSpy
      const element = await basicFixture();
      element.amf = await AmfLoader.load();
      await nextFrame();
      assert.isTrue(clearCacheSpy.called);
    });

    it('should not clear cache after AMF change with persistCache', async () => {
      const clearCacheSpy = sinon.spy();
      ApiViewModel.prototype.clearCache = clearCacheSpy
      const element = await basicFixture();
      element.persistCache = true;
      element.amf = await AmfLoader.load();
      await nextFrame();
      assert.isFalse(clearCacheSpy.called);
    });
  });

  [
    { label: 'Compact model', compact: true },
    { label: 'Regular model', compact:false }
  ].forEach(({label, compact}) => {
    describe(`Populating annotated fields - ${label}`, () => {
      const annotatedParametersApi = 'annotated-parameters';
      let amf = null;
      let element = null;

      beforeEach(async () => {
        clearCache();
        amf = await AmfLoader.load({ fileName: annotatedParametersApi, compact });
        const selected = AmfLoader.lookupOperation(amf, '/test', 'get')['@id'];
        element = await modelFixture(amf, selected);
      });

      it('should populate annotated query parameter field', async () => {
        const detail = { values: [{ annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value' }] };
        document.dispatchEvent(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
        await aTimeout(50);
        const finalValues = element._queryModel.map(qm => qm.value);
        assert.deepEqual(finalValues, ['', 'test value']);
      });

      it('should populate annotated header field', async () => {
        const detail = { values: [{ annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value' }] };
        document.dispatchEvent(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
        await aTimeout(50);
        const finalValues = element._headers;
        assert.equal(finalValues, 'annotatedHeader: test value\nnormalHeader: ');
      });

      it('should populate annotated query parameter and header fields', async () => {
        const detail = { values: [
          { annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value 1' },
          { annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value 2' },
        ] };
        document.dispatchEvent(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
        await aTimeout(50);
        const headers = element._headers;
        assert.equal(headers, 'annotatedHeader: test value 2\nnormalHeader: ');
        const queryParams = element._queryModel.map(qm => qm.value);
        assert.deepEqual(queryParams, ['', 'test value 1']);
      });

      it('_updateHeader should not throw error if header isn\'t in form', async () => {
        element.allowCustom = true;
        await nextFrame();
        const headersEditor = element.shadowRoot.querySelector('api-headers-editor')
        const firstIconButton = headersEditor.shadowRoot.querySelector('.params-list anypoint-icon-button')
        firstIconButton.click()
        await nextFrame();
        const detail = { values: [
            { annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value 1' },
            { annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value 2' },
          ] };
        assert.doesNotThrow(() => {
          element._populateAnnotatedFieldsHandler(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
        });
      });
    });
  });

  describe('_computeCustomPropertiesNamesAndValues()', () => {
    it('should return properties when they use "@base" properties', async () => {
      const amf = {
        "@type": [
          "doc:DomainElement",
          "apiContract:EndPoint"
        ],
        "@context": {
          "@base": "amf://id",
          "data": "http://a.ml/vocabularies/data#",
          "sources": "http://a.ml/vocabularies/document-source-maps#",
          "owl": "http://www.w3.org/2002/07/owl#",
          "apiContract": "http://a.ml/vocabularies/apiContract#",
          "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
          "apiBinding": "http://a.ml/vocabularies/apiBinding#",
          "shacl": "http://www.w3.org/ns/shacl#",
          "core": "http://a.ml/vocabularies/core#",
          "security": "http://a.ml/vocabularies/security#",
          "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          "shapes": "http://a.ml/vocabularies/shapes#",
          "meta": "http://a.ml/vocabularies/meta#",
          "doc": "http://a.ml/vocabularies/document#"
        }
      }
      const element = await modelFixture(amf)
      const items = element._computeCustomPropertiesNamesAndValues({
        "@id": "#66",
        "@type": [
          "doc:DomainElement",
          "apiContract:Parameter"
        ],
        "@base:#1": [
          {
            "@id": "#71",
            "@type": [
              "doc:DomainElement",
              "data:Node",
              "data:Scalar"
            ],
            "core:name": [
              {
                "@value": "scalar_1",
                "__apicResolved": true
              }
            ],
            "data:value": [
              {
                "@value": "id",
                "__apicResolved": true
              }
            ],
            "sources:sources": [
              {
                "@id": "#71/source-map",
                "sources:lexical": [
                  {
                    "@value": "[(13,26)-(13,28)]",
                    "__apicResolved": true
                  }
                ],
                "__apicResolved": true
              }
            ],
            "shacl:datatype": [
              {
                "@id": "http://www.w3.org/2001/XMLSchema#string",
                "__apicResolved": true
              }
            ],
            "__apicResolved": true
          }
        ],
        "apiContract:binding": [
          {
            "@value": "header",
            "__apicResolved": true
          }
        ],
        "apiContract:paramName": [
          {
            "@value": "client_id",
            "__apicResolved": true
          }
        ],
        "apiContract:required": [
          {
            "@value": true,
            "__apicResolved": true
          }
        ],
        "core:name": [
          {
            "@value": "client_id",
            "__apicResolved": true
          }
        ],
        "doc:customDomainProperties": [
          {
            "@id": "#1",
            "@type": [
              "doc:DomainElement",
              "rdf:Property",
              "doc:DomainProperty"
            ],
            "core:extensionName": [
              {
                "@value": "credentialType",
                "__apicResolved": true
              }
            ],
            "core:name": [
              {
                "@value": "credentialType",
                "__apicResolved": true
              }
            ],
            "sources:sources": [
              {
                "@id": "#1/source-map",
                "sources:lexical": [
                  "[(6,2)-(6,16)]",
                  "[(6,2)-(8,0)]"
                ],
                "__apicResolved": true
              }
            ],
            "shapes:schema": [
              {
                "@id": "#2",
                "@type": [
                  "doc:DomainElement",
                  "shapes:Shape",
                  "shacl:Shape",
                  "shapes:AnyShape",
                  "shapes:ScalarShape"
                ],
                "sources:sources": [
                  {
                    "@id": "#2/source-map",
                    "sources:lexical": [
                      {
                        "@value": "[(6,18)-(6,24)]",
                        "__apicResolved": true
                      }
                    ],
                    "__apicResolved": true
                  }
                ],
                "shacl:datatype": [
                  {
                    "@id": "http://www.w3.org/2001/XMLSchema#string",
                    "__apicResolved": true
                  }
                ],
                "shacl:name": [
                  {
                    "@value": "credentialType",
                    "__apicResolved": true
                  }
                ],
                "__apicResolved": true
              }
            ],
            "__apicResolved": true
          }
        ],
        "sources:sources": [
          {
            "@id": "#66/source-map",
            "sources:lexical": [
              {
                "@value": "[(11,6)-(13,28)]",
                "__apicResolved": true
              }
            ],
            "__apicResolved": true
          }
        ],
        "shapes:schema": [
          {
            "@id": "#67",
            "@type": [
              "shapes:AnyShape",
              "doc:DomainElement",
              "shacl:Shape",
              "shapes:ScalarShape",
              "shapes:Shape"
            ],
            "@base:#1": [
              {
                "@id": "#69",
                "@type": [
                  "doc:DomainElement",
                  "data:Node",
                  "data:Scalar"
                ],
                "core:name": [
                  {
                    "@value": "scalar_1",
                    "__apicResolved": true
                  }
                ],
                "data:value": [
                  {
                    "@value": "id",
                    "__apicResolved": true
                  }
                ],
                "sources:sources": [
                  {
                    "@id": "#69/source-map",
                    "sources:lexical": [
                      {
                        "@value": "[(13,26)-(13,28)]",
                        "__apicResolved": true
                      }
                    ],
                    "__apicResolved": true
                  }
                ],
                "shacl:datatype": [
                  {
                    "@id": "http://www.w3.org/2001/XMLSchema#string",
                    "__apicResolved": true
                  }
                ],
                "__apicResolved": true
              }
            ],
            "doc:customDomainProperties": [
              {
                "@id": "#1",
                "@type": [
                  "doc:DomainElement",
                  "rdf:Property",
                  "doc:DomainProperty"
                ],
                "core:extensionName": [
                  {
                    "@value": "credentialType",
                    "__apicResolved": true
                  }
                ],
                "core:name": [
                  {
                    "@value": "credentialType",
                    "__apicResolved": true
                  }
                ],
                "sources:sources": [
                  {
                    "@id": "#1/source-map",
                    "sources:lexical": [
                      "[(6,2)-(6,16)]",
                      "[(6,2)-(8,0)]"
                    ],
                    "__apicResolved": true
                  }
                ],
                "shapes:schema": [
                  {
                    "@id": "#2",
                    "@type": [
                      "doc:DomainElement",
                      "shapes:Shape",
                      "shacl:Shape",
                      "shapes:AnyShape",
                      "shapes:ScalarShape"
                    ],
                    "sources:sources": [
                      {
                        "@id": "#2/source-map",
                        "sources:lexical": [
                          {
                            "@value": "[(6,18)-(6,24)]",
                            "__apicResolved": true
                          }
                        ],
                        "__apicResolved": true
                      }
                    ],
                    "shacl:datatype": [
                      {
                        "@id": "http://www.w3.org/2001/XMLSchema#string",
                        "__apicResolved": true
                      }
                    ],
                    "shacl:name": [
                      {
                        "@value": "credentialType",
                        "__apicResolved": true
                      }
                    ],
                    "__apicResolved": true
                  }
                ],
                "__apicResolved": true
              }
            ],
            "sources:sources": [
              {
                "@id": "#67/source-map",
                "sources:lexical": [
                  "[(12,8)-(12,20)]",
                  "[(11,6)-(13,28)]"
                ],
                "__apicResolved": true
              }
            ],
            "shacl:datatype": [
              {
                "@id": "http://www.w3.org/2001/XMLSchema#string",
                "__apicResolved": true
              }
            ],
            "shacl:name": [
              {
                "@value": "schema",
                "__apicResolved": true
              }
            ],
            "__apicResolved": true
          }
        ],
        "__apicResolved": true
      })
      assert.lengthOf(items, 1);
    });
  });
});
