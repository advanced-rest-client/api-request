/* eslint-disable no-param-reassign */
import { fixture, assert, html, nextFrame, aTimeout } from '@open-wc/testing';
import * as sinon from 'sinon';
import { ApiViewModel } from '@api-components/api-forms'
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';

/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../../').ApiAuthorizationMethodElement} ApiAuthorizationMethodElement */
/** @typedef {import('../../').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  /** @type AmfLoader */
  let store;
  before(async () => {
    store = new AmfLoader();
  });

  /**
   * @param {AmfDocument=} model
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function basicFixture(model) {
    return (fixture(html`<api-request-editor .amf="${model}"></api-request-editor>`));
  }

  /**
   * @param {AmfDocument=} model
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function allowCustomFixture(model) {
    return (fixture(html`<api-request-editor .amf="${model}" allowCustom></api-request-editor>`));
  }

  /**
   * @param {AmfDocument} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function modelFixture(model, selected) {
    return (fixture(html`<api-request-editor
      .amf="${model}"
      .selected="${selected}"></api-request-editor>`));
  }

  /**
   * @param {AmfDocument} model
   * @param {string} selected
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function urlLabelFixture(model, selected) {
    return (fixture(html`<api-request-editor
      .amf="${model}"
      .selected="${selected}"
      urlLabel></api-request-editor>`));
  }

  /**
   * @param {AmfDocument=} model
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function customBaseUriSlotFixture(model) {
    return (fixture(html`
      <api-request-editor .amf="${model}">
        <anypoint-item slot="custom-base-uri" value="http://customServer.com">Custom</anypoint-item>
      </api-request-editor>`));
  }

  /**
   * @param {AmfDocument=} model
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function noSelectorFixture(model) {
    return (fixture(html`
      <api-request-editor noServerSelector .amf="${model}">
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
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), httpbinApi);
        });

        it('sets _httpMethod property (get)', async () => {
          const method = store.lookupOperation(model, '/anything', 'get');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'get');
        });

        it('sets _httpMethod property (post)', async () => {
          const method = store.lookupOperation(model, '/anything', 'post');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'post');
        });

        it('sets _httpMethod property (put)', async () => {
          const method = store.lookupOperation(model, '/anything', 'put');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'put');
        });

        it('sets _httpMethod property (delete)', async () => {
          const method = store.lookupOperation(model, '/anything', 'delete');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'delete');
        });
      });

      describe('_computeApiPayload() and _apiPayload', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), driveApi);
        });

        it('returns undefined when no model', async () => {
          const element = await basicFixture();
          assert.isUndefined(element._computeApiPayload());
        });

        it('returns undefined when no "expects"', async () => {
          const element = await basicFixture(model);
          assert.isUndefined(element._computeApiPayload({}));
        });

        it('returns payload definition', async () => {
          const method = store.lookupOperation(model, '/files/{fileId}', 'patch');
          const element = await basicFixture(model);
          assert.typeOf(element._computeApiPayload(method), 'array');
        });

        it('sets _apiPayload when selection changed', async () => {
          const method = store.lookupOperation(model, '/files/{fileId}', 'patch');
          const element = await modelFixture(model, method['@id']);
          assert.typeOf(element.apiPayload, 'array');
        });
      });

      describe('_isPayloadRequest', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), driveApi);
        });

        it('is false for get request', async () => {
          const method = store.lookupOperation(model, '/files/{fileId}', 'get');
          const element = await modelFixture(model, method['@id']);
          assert.isFalse(element.isPayloadRequest);
        });

        it('returns true for post request', async () => {
          const method = store.lookupOperation(model, '/files/{fileId}', 'patch');
          const element = await modelFixture(model, method['@id']);
          assert.isTrue(element.isPayloadRequest);
        });
      });

      describe('Security computations', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), driveApi);
        });

        it('does not set variables when no security', async () => {
          const element = await basicFixture(model);
          assert.isUndefined(element.security);
        });

        it('sets the security value', async () => {
          const method = store.lookupOperation(model, '/files', 'get');
          const element = await modelFixture(model, method['@id']);
          assert.typeOf(element.security, 'array', 'has the security');
          assert.lengthOf(element.security, 1, 'has the single scheme');
          const [scheme] = element.security;
          assert.deepEqual(scheme.types, ['OAuth 2.0'], 'has types definition');
          assert.deepEqual(scheme.labels, ['oauth_2_0'], 'has labels definition');
          assert.typeOf(scheme.security, 'object', 'has the security definition');
        });

        it('sets the selectedSecurity', async () => {
          const method = store.lookupOperation(model, '/files', 'get');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.selectedSecurity, 0);
        });
      });

      describe('_computeHeaders() and _apiHeaders', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        it('returns undefined when no model', async () => {
          const element = await basicFixture(model);
          assert.isUndefined(element._computeHeaders());
        });

        it('returns undefined when no security model', async () => {
          const element = await basicFixture(model);
          assert.isUndefined(element._computeHeaders({}));
        });

        it('returns headers model', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const security = element._computeHeaders(method);
          assert.typeOf(security, 'array');
        });

        it('sets _apiHeaders', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          assert.typeOf(element.apiHeaders, 'array');
          assert.lengthOf(element.apiHeaders, 1);
        });
      });

      describe('#contentType', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        it('sets content type from the body', async () => {
          const method = store.lookupOperation(model, '/content-type', 'post');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(100);
          await nextFrame();
          assert.equal(element.contentType, 'application/json');
        });
      });

      describe('ui state', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        it('renders authorization panel when authorization is required', async () => {
          const method = store.lookupOperation(model, '/messages', 'get');
          const element = await modelFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('api-authorization-editor');
          assert.ok(node);
        });

        it('renders query/uri editor when model is set', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('api-url-params-editor').parentElement;
          assert.isFalse(node.hasAttribute('hidden'));
        });

        it('renders headers editor when model is set', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('api-headers-editor').parentElement;
          assert.isFalse(node.hasAttribute('hidden'));
        });

        it('hides URL editor when noUrlEditor', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          element.noUrlEditor = true;
          await nextFrame();
          const node = element.shadowRoot.querySelector('.url-editor');
          assert.isTrue(node.hasAttribute('hidden'));
        });

        it('computes URL when URL editor is hidden', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          element.noUrlEditor = true;
          await nextFrame();
          assert.equal(element.url, 'http://production.domain.com/people');
        });
      });

      describe('execute()', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        /** @type ApiRequestEditorElement */
        let element;
        beforeEach(async () => {
          clearCache();
          const method = store.lookupOperation(model, '/people', 'get');
          element = await modelFixture(model, method['@id']);
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
          element.execute();
          const compare = element.serializeRequest();
          compare.id = element.requestId;
          assert.deepEqual(spy.args[0][1], compare);
        });
      });

      describe('abort()', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });
        
        let element = /** @type ApiRequestEditorElement */ (null);
        beforeEach(async () => {
          clearCache();
          const method = store.lookupOperation(model, '/people', 'get');
          element = await modelFixture(model, method['@id']);
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
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        beforeEach(async () => {
          clearCache();
        });

        it('Returns an object', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const result = element.serializeRequest();
          assert.typeOf(result, 'object');
        });

        it('Sets editor url', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          await nextFrame();
          const result = element.serializeRequest();
          assert.equal(result.url, 'http://production.domain.com/people');
        });

        it('Sets editor method', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const result = element.serializeRequest();
          assert.equal(result.method, 'GET');
        });

        it('Sets headers from the editor', async () => {
          const method = store.lookupOperation(model, '/post-headers', 'post');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(10);
          const result = element.serializeRequest();
          assert.equal(result.headers, 'x-string: my-value\ncontent-type: application/json');
        });

        it('sets editor payload', async () => {
          const method = store.lookupOperation(model, '/people', 'post');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.ok(result.payload);
          assert.equal(result.payload, element.payload);
        });

        it('sets auth data', async () => {
          const method = store.lookupOperation(model, '/people/{personId}', 'get');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.typeOf(result.authorization, 'array');
          assert.lengthOf(result.authorization, 1);
          assert.equal(result.authorization[0].type, 'custom');
        });

        it('does not set editor payload when GET request', async () => {
          const postMethod = store.lookupOperation(model, '/people', 'post');
          const element = await modelFixture(model, postMethod['@id']);
          await aTimeout(0);
          const getMethod = store.lookupOperation(model, '/people', 'get');
          element.selected = getMethod['@id'];
          await aTimeout(0);
          const result = element.serializeRequest();
          assert.isUndefined(result.payload);
        });

        it('does not set editor payload when HEAD request', async () => {
          const postMethod = store.lookupOperation(model, '/people', 'post');
          const element = await modelFixture(model, postMethod['@id']);
          await aTimeout(0);
          const getMethod = store.lookupOperation(model, '/people', 'head');
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
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        // it('calls authAndExecute() when authorization is required', async () => {
        //   const method = store.lookupOperation(model, '/messages', 'get');
        //   const element = await modelFixture(model, method['@id']);
        //   await aTimeout(5);
        //   const spy = sinon.spy(element, 'authAndExecute');
        //   const button = element.shadowRoot.querySelector('.send-button');
        //   /** @type HTMLElement */ (button).click();
        //   await aTimeout(25);
        //   assert.isTrue(spy.called);
        // });

        it('calls execute() when authorization is not required', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(5);
          const spy = sinon.spy(element, 'execute');
          const button = element.shadowRoot.querySelector('.send-button');
          /** @type HTMLElement */ (button).click();
          assert.isTrue(spy.called);
        });
      });

      describe('#urlLabel', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        it('renders the url label', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await urlLabelFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('.url-label');
          assert.ok(node);
        });

        it('renders the url value', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await urlLabelFixture(model, method['@id']);
          await nextFrame();
          const node = element.shadowRoot.querySelector('.url-label');
          const text = node.textContent.trim();
          assert.equal(text, 'http://production.domain.com/people');
        });
      });

      describe('slotted servers', () => {
        /** @type ApiRequestEditorElement */
        let element;
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact));
        });

        beforeEach(async () => {
          element = await customBaseUriSlotFixture(model);
          const op = store.lookupOperation(model, '/people', 'get')
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
        
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), multiServerApi);
        });

        let element = /** @type ApiRequestEditorElement */ (null);
        beforeEach(async () => {
          element = await modelFixture(model);
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
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), multiServerApi);
        });
        
        let element = /** @type ApiRequestEditorElement */ (null);
        beforeEach(async () => {
          element = await modelFixture(model);
        });

        it('has default number of servers', async () => {
          assert.lengthOf(element.servers, 4);
        });

        it('computes servers when first navigation', async () => {
          const method = store.lookupOperation(model, '/default', 'get');
          changeSelection(element, method['@id']);
          await nextFrame();
          assert.lengthOf(element.servers, 4);
        });

        it('computes servers after subsequent navigation', async () => {
          // default navigation
          changeSelection(element, store.lookupOperation(model, '/default', 'get')['@id']);
          await nextFrame();
          // other endpoint
          changeSelection(element, store.lookupOperation(model, '/files', 'get')['@id']);
          await nextFrame();
          assert.lengthOf(element.servers, 1);
        });

        it('automatically selects first available server', async () => {
          changeSelection(element, store.lookupOperation(model, '/default', 'get')['@id']);
          await nextFrame();
          assert.equal(element.serverValue, 'https://{customerId}.saas-app.com:{port}/v2');
        });

        it('auto change selected server', async () => {
          changeSelection(element, store.lookupOperation(model, '/default', 'get')['@id']);
          await nextFrame();
          changeSelection(element, store.lookupOperation(model, '/files', 'get')['@id']);
          await nextFrame();
          assert.equal(element.serverValue, 'https://files.example.com');
        });

        it('keeps server selection when possible', async () => {
          changeSelection(element, store.lookupOperation(model, '/default', 'get')['@id']);
          await nextFrame();

          dispatchSelectionEvent(element, 'https://{region}.api.cognitive.microsoft.com', 'server');

          changeSelection(element, store.lookupOperation(model, '/copy', 'get')['@id']);
          await nextFrame();
          assert.equal(element.serverValue, 'https://{region}.api.cognitive.microsoft.com');
        });

        it('initializes with selected server', async () => {
          const methodId = store.lookupOperation(model, '/ping', 'get')['@id'];
          element = await modelFixture(model, methodId);
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
      const model = await store.getGraph();
      await basicFixture(model);
      await nextFrame();
      assert.isTrue(clearCacheSpy.called);
    });

    it('should not clear cache after AMF change with persistCache', async () => {
      const clearCacheSpy = sinon.spy();
      ApiViewModel.prototype.clearCache = clearCacheSpy
      const model = await store.getGraph();
      const element = await basicFixture();
      element.persistCache = true;
      element.amf = model;
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
      
      /** @type AmfDocument */
      let model;
      before(async () => {
        model = await store.getGraph(Boolean(compact), annotatedParametersApi);
      });
      
      let element = null;
      beforeEach(async () => {
        clearCache();
        const selected = store.lookupOperation(model, '/test', 'get')['@id'];
        element = await modelFixture(model, selected);
      });

      it('should populate annotated query parameter field', async () => {
        const detail = { values: [{ annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value' }] };
        document.dispatchEvent(new CustomEvent('populate-annotated-fields', { detail, bubbles: true }));
        await aTimeout(50);
        const finalValues = element._queryModel.map(qm => qm.value);
        assert.deepEqual(finalValues, ['', 'test value']);
      });

      it('should populate annotated header field', async () => {
        const detail = { values: [{ annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value' }] };
        document.dispatchEvent(new CustomEvent('populate-annotated-fields', { detail, bubbles: true }));
        await aTimeout(50);
        const finalValues = element._headers;
        assert.equal(finalValues, 'annotatedHeader: test value\nnormalHeader: ');
      });

      it('should populate annotated query parameter and header fields', async () => {
        const detail = { values: [
          { annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value 1' },
          { annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value 2' },
        ] };
        document.dispatchEvent(new CustomEvent('populate-annotated-fields', { detail, bubbles: true }));
        await aTimeout(50);
        const headers = element._headers;
        assert.equal(headers, 'annotatedHeader: test value 2\nnormalHeader: ');
        const queryParams = element._queryModel.map(qm => qm.value);
        assert.deepEqual(queryParams, ['', 'test value 1']);
      });
    });
  });

  describe('Authorization', () => {
    [true, false].forEach((compact) => {
      describe(compact ? 'Compact model' : 'Full model', () => {
        const fileName = 'oas-demo';

        describe(`Single method`, () => {
          /** @type AmfDocument */
          let model;
          before(async () => {
            model = await store.getGraph(compact, fileName);
          });
          
          /** @type ApiRequestEditorElement */
          let element;
          beforeEach(async () => {
            const operation = store.getOperation(model, '/single', 'get');
            element = await modelFixture(model, operation.id);
          });

          it('sets the security value', async () => {
            assert.typeOf(element.security, 'array', 'has the security');
            assert.lengthOf(element.security, 1, 'has the single scheme');
            const [scheme] = element.security;
            assert.deepEqual(scheme.types, ['http'], 'has types definition');
            assert.deepEqual(scheme.labels, ['BasicAuth'], 'has labels definition');
            assert.typeOf(scheme.security, 'object', 'has the security definition');
          });
  
          it('sets the selectedSecurity', async () => {
            assert.equal(element.selectedSecurity, 0);
          });

          it('has no selector', () => {
            const node = element.shadowRoot.querySelector('.auth-selector');
            assert.notOk(node);
          });
        });

        describe(`Single method with union`, () => {
          /** @type AmfDocument */
          let model;
          before(async () => {
            model = await store.getGraph(compact, fileName);
          });
          
          /** @type ApiRequestEditorElement */
          let element;
          beforeEach(async () => {
            const operation = store.getOperation(model, '/and-and-or-union', 'get');
            element = await modelFixture(model, operation.id);
          });
  
          it('sets the security value', async () => {
            assert.typeOf(element.security, 'array', 'has the security');
            assert.lengthOf(element.security, 2, 'has the both schemes');
            const [scheme1] = element.security;
            assert.deepEqual(scheme1.types, ['Api Key', 'Api Key'], 'has types definition');
            assert.deepEqual(scheme1.labels, ['ApiKeyQuery', 'ApiKeyAuth'], 'has labels definition');
            assert.typeOf(scheme1.security, 'object', 'has the security definition');
          });
  
          it('has method selector', () => {
            const node = element.shadowRoot.querySelector('.auth-selector');
            assert.ok(node);
          });
  
          it('renders combined label', () => {
            const node = element.shadowRoot.querySelector('anypoint-item[data-label="ApiKeyQuery, ApiKeyAuth"]');
            assert.ok(node);
          });
  
          it('renders label with names and types', () => {
            const node = element.shadowRoot.querySelector('anypoint-item[data-label="ApiKeyQuery, ApiKeyAuth"]');
            const parts = node.textContent.trim().split('\n').map((item) => item.trim());
            assert.equal(parts[0], 'ApiKeyQuery, ApiKeyAuth');
            assert.equal(parts[1], 'Api Key, Api Key');
          });
  
          it('renders as single editor', () => {
            const nodes = element.shadowRoot.querySelectorAll('api-authorization-editor');
            assert.lengthOf(nodes, 1);
          });
        });

        describe(`Multiple unions`, () => {
          /** @type AmfDocument */
          let model;
          before(async () => {
            model = await store.getGraph(compact, fileName);
          });
          
          /** @type ApiRequestEditorElement */
          let element;
          beforeEach(async () => {
            const operation = store.getOperation(model, '/cross-union', 'get');
            element = await modelFixture(model, operation.id);
          });
  
          it('sets the security value', async () => {
            assert.typeOf(element.security, 'array', 'has the security');
            assert.lengthOf(element.security, 3, 'has the both schemes');
            const [scheme1] = element.security;
            assert.deepEqual(scheme1.types, ['Api Key', 'Api Key'], 'has types definition');
            assert.deepEqual(scheme1.labels, ['ApiKeyQuery', 'ApiKeyAuth'], 'has labels definition');
            assert.typeOf(scheme1.security, 'object', 'has the security definition');
          });
  
          it('has method selector', () => {
            const node = element.shadowRoot.querySelector('.auth-selector');
            assert.ok(node);
          });
  
          it('has no scheme label', () => {
            const node = element.shadowRoot.querySelector('.auth-selector-label');
            assert.notOk(node);
          });
  
          it('does not render method labels for API Key', () => {
            const nodes = element.shadowRoot.querySelectorAll('.auth-label');
            assert.lengthOf(nodes, 0);
          });
        });
      });
    });
  });
});
