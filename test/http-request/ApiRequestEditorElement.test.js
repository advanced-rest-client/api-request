/* eslint-disable no-param-reassign */
import { fixture, assert, html, nextFrame, aTimeout } from '@open-wc/testing';
import * as sinon from 'sinon';
import * as InputCache from '../../src/lib/InputCache.js';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-editor.js';
import { loadMonaco } from '../MonacoSetup.js';
import { RequestEvents, ApiResponseEvent } from '../../src/events/RequestEvents.js';
import { EventTypes } from '../../src/events/EventTypes.js';
import { 
  responseHandler, 
  loadingRequestValue, 
  requestIdValue,
  serverHandler,
} from '../../src/elements/ApiRequestEditorElement.js';

/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../../').ApiAuthorizationMethodElement} ApiAuthorizationMethodElement */
/** @typedef {import('../../').ApiRequestEditorElement} ApiRequestEditorElement */

describe('ApiRequestEditorElement', () => {
  /** @type AmfLoader */
  let store;
  before(async () => {
    await loadMonaco();
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
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function urlEditorFixture(model, selected) {
    return (fixture(html`<api-request-editor
      .amf="${model}"
      .selected="${selected}"
      urlEditor></api-request-editor>`));
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
        <anypoint-item slot="custom-base-uri" data-value="http://customServer.com">Custom</anypoint-item>
      </api-request-editor>`));
  }

  /**
   * @param {AmfDocument=} model
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function noSelectorFixture(model) {
    return (fixture(html`
      <api-request-editor noServerSelector .amf="${model}">
        <anypoint-item slot="custom-base-uri" data-value="http://customServer.com">http://customServer.com</anypoint-item>
      </api-request-editor>`));
  }

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestEditorElement>}
   */
  async function hideOptionalFixture(model, selected) {
    return (fixture(html`<api-request-editor
      .amf="${model}"
      .selected="${selected}"
      allowHideOptional></api-request-editor>`));
  }

  describe('initialization', () => {
    it('can be initialized with document.createElement', () => {
      const element = document.createElement('api-request-editor');
      assert.ok(element);
    });

    it('does not render the URL editor by default', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.url-input');
      assert.notOk(node);
    });

    it('renders the url editor when configured', async () => {
      const element = await urlEditorFixture();
      const node = element.shadowRoot.querySelector('.url-input');
      assert.ok(node);
    });

    it('renders the send button without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.send-button');
      assert.ok(node);
    });

    it('send button has "send" label', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.send-button');
      assert.equal(node.textContent.trim(), 'Send');
    });

    it('does not render headers form without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.params-section.header');
      assert.notOk(node);
    });

    it('does not render parameters form without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.params-section.parameter');
      assert.notOk(node);
    });

    it('does not render payload editor without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.body-editor');
      assert.notOk(node);
    });

    it('does not render authorization editor without the model', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('api-authorization-editor');
      assert.notOk(node);
    });

    it('does not render url label', async () => {
      const element = await basicFixture();
      const node = element.shadowRoot.querySelector('.url-label');
      assert.notOk(node);
    });
  });

  describe('custom properties', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await allowCustomFixture();
    });

    it('renders parameters form', async () => {
      const node = element.shadowRoot.querySelector('.params-section.parameter');
      assert.ok(node);
    });

    it('renders the parameters add button', async () => {
      const node = element.shadowRoot.querySelector('.params-section.parameter .add-custom-button');
      assert.ok(node);
    });

    it('renders header form', async () => {
      const node = element.shadowRoot.querySelector('.params-section.header');
      assert.ok(node);
    });

    it('renders the header add button', async () => {
      const node = element.shadowRoot.querySelector('.params-section.header .add-custom-button');
      assert.ok(node);
    });
  });

  describe('OAuth2 redirect URI change event', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('sets redirectUri from the event (legacy)', () => {
      const value = 'https://auth.domain.com';
      document.body.dispatchEvent(new CustomEvent(EventTypes.Request.redirectUriChangeLegacy, {
        bubbles: true,
        detail: {
          value
        }
      }));
      assert.equal(element.redirectUri, value);
    });

    it('sets redirectUri from the event', () => {
      const value = 'https://auth.domain.com';
      document.body.dispatchEvent(new CustomEvent(EventTypes.Request.redirectUriChange, {
        bubbles: true,
        detail: {
          value
        }
      }));
      assert.equal(element.redirectUri, value);
    });
  });

  describe('[responseHandler]()', () => {
    let element = /** @type ApiRequestEditorElement */ (null);
    const requestId = 'test-id';
    beforeEach(async () => {
      InputCache.globalValues.clear();
      element = await basicFixture();
      element[loadingRequestValue] = true;
      element[requestIdValue] = requestId;
    });

    it('does nothing when the id is different', () => {
      const e = new ApiResponseEvent(EventTypes.Request.apiResponse, {
        id: 'otherId',
        isError: true,
        loadingTime: 0,
        request: {
          method: '',
          url: '',
        },
        response: {
          status: 0,
        },
      });
      element[responseHandler](e);
      assert.isTrue(element.loadingRequest);
    });

    it('does nothing when no detail', () => {
      const e = new CustomEvent(EventTypes.Request.apiResponse);
      element[responseHandler](e);
      assert.isTrue(element.loadingRequest);
    });

    it('resets the loadingRequest property', () => {
      const e = new CustomEvent(EventTypes.Request.apiResponse, {
        detail: {
          id: requestId,
        }
      });
      element[responseHandler](e);
      assert.isFalse(element.loadingRequest);
    });

    it('event handler is connected', () => {
      RequestEvents.apiResponse(document.body, {
        id: requestId,
        isError: true,
        loadingTime: 0,
        request: {
          method: '',
          url: '',
        },
        response: {
          status: 0,
        },
      });
      assert.isFalse(element.loadingRequest);
    });
  });

  [true, false].forEach((compact) => {
    describe(compact ? 'Compact model' : 'Full model', () => {
      const httpbinApi = 'httpbin';
      const driveApi = 'google-drive-api';
      const demoApi = 'demo-api';

      describe('http method computation', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(compact, httpbinApi);
        });

        it('sets httpMethod property (get)', async () => {
          const method = store.lookupOperation(model, '/anything', 'get');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'get');
        });

        it('sets httpMethod property (post)', async () => {
          const method = store.lookupOperation(model, '/anything', 'post');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'post');
        });

        it('sets httpMethod property (put)', async () => {
          const method = store.lookupOperation(model, '/anything', 'put');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'put');
        });

        it('sets httpMethod property (delete)', async () => {
          const method = store.lookupOperation(model, '/anything', 'delete');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.httpMethod, 'delete');
        });
      });

      describe('#payloads and #payload', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(compact, driveApi);
        });

        it('sets the #payloads for the endpoint', async () => {
          const method = store.lookupOperation(model, '/files/{fileId}', 'patch');
          const element = await modelFixture(model, method['@id']);
          assert.typeOf(element.payloads, 'array');
          assert.lengthOf(element.payloads, 1);
        });

        it('sets the #payload property', async () => {
          const method = store.lookupOperation(model, '/files/{fileId}', 'patch');
          const element = await modelFixture(model, method['@id']);
          assert.typeOf(element.payload, 'object');
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

      describe('RAML parameters computations', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(compact, demoApi);
        });

        it('sets server parameters when no operation', async () => {
          const element = await basicFixture(model);
          assert.lengthOf(element.parametersValue, 1, 'has a single parameter');
          const [param] = element.parametersValue;
          assert.equal(param.binding, 'path', 'has a path parameter');
          assert.equal(param.source, 'server', 'the parameter was set by the server');
        });

        it('sets path parameters from the server and the endpoint', async () => {
          const method = store.lookupOperation(model, '/test-parameters/{feature}', 'get');
          const element = await modelFixture(model, method['@id']);
          const path = element.parametersValue.filter(p => p.binding === 'path')
          assert.lengthOf(path, 2, 'has all parameters');
          assert.typeOf(
            path.find(p => p.parameter.name === 'feature'),
            'object',
            'has the endpoints path parameter'
          );
          assert.typeOf(
            path.find(p => p.parameter.name === 'instance'),
            'object',
            'has the server path parameter'
          );
        });

        it('sets query parameters', async () => {
          const method = store.lookupOperation(model, '/test-parameters/{feature}', 'get');
          const element = await modelFixture(model, method['@id']);
          const path = element.parametersValue.filter(p => p.binding === 'query')
          assert.lengthOf(path, 3, 'has all parameters');
          assert.typeOf(
            path.find(p => p.parameter.name === 'testRepeatable'),
            'object',
            'has the testRepeatable parameter'
          );
          assert.typeOf(
            path.find(p => p.parameter.name === 'numericRepeatable'),
            'object',
            'has the numericRepeatable parameter'
          );
          assert.typeOf(
            path.find(p => p.parameter.name === 'notRequiredRepeatable'),
            'object',
            'has the notRequiredRepeatable parameter'
          );
        });

        it('sets header parameters', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const path = element.parametersValue.filter(p => p.binding === 'header')
          assert.lengthOf(path, 1, 'has all parameters');
          assert.typeOf(
            path.find(p => p.parameter.name === 'x-people-op-id'),
            'object',
            'has the x-people-op-id parameter'
          );
        });
      });

      describe('#mimeType', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        it('sets content type from the body', async () => {
          const method = store.lookupOperation(model, '/content-type', 'post');
          const element = await modelFixture(model, method['@id']);
          assert.equal(element.mimeType, 'application/json');
        });
      });

      describe('ui state', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        it('renders the authorization editor when authorization is required', async () => {
          const method = store.lookupOperation(model, '/messages', 'get');
          const element = await modelFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('api-authorization-editor');
          assert.ok(node);
        });

        it('renders query/uri forms when model is set', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('.params-section.parameter');
          assert.ok(node);
        });

        it('renders headers editor when model is set', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('.params-section.header');
          assert.ok(node);
        });

        it('renders the URL editor when urlEditor', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await urlEditorFixture(model, method['@id']);
          const node = element.shadowRoot.querySelector('.url-input');
          assert.ok(node);
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
          InputCache.globalValues.clear();
          const method = store.lookupOperation(model, '/people', 'get');
          element = await modelFixture(model, method['@id']);
        });

        it('dispatches the legacy request event', () => {
          const spy = sinon.spy();
          element.addEventListener(EventTypes.Request.apiRequestLegacy, spy);
          element.execute();
          assert.isTrue(spy.called);
        });

        it('dispatches the request event', () => {
          const spy = sinon.spy();
          element.addEventListener(EventTypes.Request.apiRequest, spy);
          element.execute();
          assert.isTrue(spy.called);
        });

        it('sets loadingRequest property', () => {
          element.execute();
          assert.isTrue(element.loadingRequest);
        });

        it('sets requestId property', () => {
          element.execute();
          assert.typeOf(element.requestId, 'string');
        });

        it('calls the serialize() function', () => {
          const spy = sinon.spy(element, 'serialize');
          element.execute();
          assert.isTrue(spy.called);
        });

        it('event has the serialized request', () => {
          const spy = sinon.spy();
          element.addEventListener(EventTypes.Request.apiRequest, spy);
          element.execute();
          const { detail } = spy.args[0][0];
          assert.equal(detail.method, 'GET');
          assert.equal(detail.url, 'http://production.domain.com/people');
          assert.equal(detail.headers, 'x-people-op-id: 9719fa6f-c666-48e0-a191-290890760b30');
          assert.typeOf(detail.id, 'string');
          assert.typeOf(detail.authorization, 'array', 'has the authorization array');
          assert.lengthOf(detail.authorization, 1, 'has as single authorization definition');
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
          InputCache.globalValues.clear();
          const method = store.lookupOperation(model, '/people', 'get');
          element = await modelFixture(model, method['@id']);
          element[loadingRequestValue] = true;
          element[requestIdValue] = 'test-request';
          await element.requestUpdate();
        });

        it('dispatched the event when the abort button pressed', () => {
          const spy = sinon.spy();
          element.addEventListener(EventTypes.Request.abortApiRequest, spy);
          const button = /** @type HTMLElement */ (element.shadowRoot.querySelector('.send-button.abort'));
          button.click();
          assert.isTrue(spy.calledOnce);
        });

        it('dispatched the legacy event when the abort button pressed', () => {
          const spy = sinon.spy();
          element.addEventListener(EventTypes.Request.abortApiRequestLegacy, spy);
          const button = /** @type HTMLElement */ (element.shadowRoot.querySelector('.send-button.abort'));
          button.click();
          assert.isTrue(spy.calledOnce);
        });

        it('the event contains the url and the id', () => {
          const spy = sinon.spy();
          element.addEventListener(EventTypes.Request.abortApiRequest, spy);
          element.abort();
          const { detail } = spy.args[0][0];
          assert.equal(detail.url, element.url, 'URL is set');
          assert.equal(detail.id, 'test-request', 'id is set');
        });

        it('resets the loadingRequest property', () => {
          element.abort();
          assert.isFalse(element.loadingRequest);
        });

        it('resets the requestId property', () => {
          element.abort();
          assert.isUndefined(element.requestId);
        });
      });

      describe('serialize()', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(Boolean(compact), demoApi);
        });

        beforeEach(async () => {
          InputCache.globalValues.clear();
        });

        it('returns an object', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const result = element.serialize();
          assert.typeOf(result, 'object');
        });

        it('sets editor url', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          await nextFrame();
          const result = element.serialize();
          assert.equal(result.url, 'http://production.domain.com/people');
        });

        it('sets editor method', async () => {
          const method = store.lookupOperation(model, '/people', 'get');
          const element = await modelFixture(model, method['@id']);
          const result = element.serialize();
          assert.equal(result.method, 'GET');
        });

        it('sets headers from the editor', async () => {
          const method = store.lookupOperation(model, '/post-headers', 'post');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(10);
          const result = element.serialize();
          assert.equal(result.headers, 'x-string: my-value\ncontent-type: application/json');
        });

        it('sets editor payload', async () => {
          const method = store.lookupOperation(model, '/people', 'post');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(0);
          const result = element.serialize();
          assert.typeOf(result.payload, 'string', 'has the payload');
          const body = JSON.parse(String(result.payload));
          // just any value, it's not important here.
          assert.equal(body.etag, '', 'has payload values');
        });

        it('sets authorization data', async () => {
          const method = store.lookupOperation(model, '/people/{personId}', 'get');
          const element = await modelFixture(model, method['@id']);
          await aTimeout(0);
          const result = element.serialize();
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
          const result = element.serialize();
          assert.isUndefined(result.payload);
        });

        it('does not set editor payload when HEAD request', async () => {
          const postMethod = store.lookupOperation(model, '/people', 'post');
          const element = await modelFixture(model, postMethod['@id']);
          await aTimeout(0);
          const getMethod = store.lookupOperation(model, '/people', 'head');
          element.selected = getMethod['@id'];
          await aTimeout(0);
          const result = element.serialize();
          assert.isUndefined(result.payload);
        });

        it('sets the content-type header if not present but set in component', async () => {
          const method = store.lookupOperation(model, '/people', 'post');
          const element = await modelFixture(model, method['@id']);
          element.parametersValue = element.parametersValue.filter(p => p.binding !== 'header');
          const result = element.serialize();
          assert.equal(result.headers, 'content-type: application/json');
        });
      });

      describe('[sendHandler]()', () => {
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
          assert.equal(text, element.url);
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
          const op = store.lookupOperation(model, '/people/{personId}', 'get')
          element.selected = op['@id'];
          await aTimeout(0);
        });

        it('should update api-url-editor value after selecting slotted base uri', async () => {
          element[serverHandler](new CustomEvent('apiserverchanged', { detail: { value: 'http://customServer.com', type: 'uri' } }));
          await aTimeout(0);
          assert.equal(element.url, 'http://customServer.com/people/1234');
        });

        it('changing the URL in the url input changes the parameters', async () => {
          element.urlEditor = true;
          element[serverHandler](new CustomEvent('apiserverchanged', { detail: { value: 'http://customServer.com', type: 'uri' } }));
          await nextFrame();
          const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.url-input'));
          input.value = 'http://customServer.com/people/5678';
          input.dispatchEvent(new Event('change'));
          assert.equal(element.url, 'http://customServer.com/people/5678', 'url value is changed');
          await nextFrame();
          const paramInput = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('[name="personId"]'));
          assert.equal(paramInput.value, '5678', 'the input is changed');
        });
      });

      describe('#allowHideOptional', () => {
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(compact, demoApi);
        });

        describe('query parameters', () => {
          it('renders the optional toggle button', async () => {
            const method = store.lookupOperation(model, '/people', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const toggle = element.shadowRoot.querySelector('.query-params .toggle-optional-switch');
            assert.ok(toggle);
          });
  
          it('optional parameters are hidden', async () => {
            const method = store.lookupOperation(model, '/people', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const allItems = element.shadowRoot.querySelectorAll('.query-params .form-item.optional');
            Array.from(allItems).forEach((node) => {
              const { display } = getComputedStyle(node);
              assert.equal(display, 'none');
            });
          });
  
          it('toggles the visibility of the parameters', async () => {
            const method = store.lookupOperation(model, '/people', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const toggle = /** @type HTMLElement */ (element.shadowRoot.querySelector('.query-params .toggle-optional-switch'));
            toggle.click();
            await nextFrame();
            assert.deepEqual(element.openedOptional, ['query'], 'adds query to the openedOptional');
            const container = element.shadowRoot.querySelector('.query-params .form-item.optional');
            const { display } = getComputedStyle(container);
            assert.equal(display, 'flex');
          });
  
          it('does not render the toggle button for all required', async () => {
            const method = store.lookupOperation(model, '/required-query-parameters', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const toggle = element.shadowRoot.querySelector('.query-params .toggle-optional-switch');
            assert.notOk(toggle, 'toggle is not rendered');
            const allItems = element.shadowRoot.querySelectorAll('.query-params .form-item');
            Array.from(allItems).forEach((node) => {
              const { display } = getComputedStyle(node);
              assert.equal(display, 'flex');
            });
          });
        });

        describe('header parameters', () => {
          it('renders the optional toggle button', async () => {
            const method = store.lookupOperation(model, '/optional-headers', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const toggle = element.shadowRoot.querySelector('.params-section.header .toggle-optional-switch');
            assert.ok(toggle);
          });
  
          it('optional parameters are hidden', async () => {
            const method = store.lookupOperation(model, '/optional-headers', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const allItems = element.shadowRoot.querySelectorAll('.params-section.header .form-item.optional');
            Array.from(allItems).forEach((node) => {
              const { display } = getComputedStyle(node);
              assert.equal(display, 'none');
            });
          });
  
          it('toggles the visibility of the parameters', async () => {
            const method = store.lookupOperation(model, '/optional-headers', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const toggle = /** @type HTMLElement */ (element.shadowRoot.querySelector('.params-section.header .toggle-optional-switch'));
            toggle.click();
            await nextFrame();
            assert.deepEqual(element.openedOptional, ['header'], 'adds query to the openedOptional');
            const container = element.shadowRoot.querySelector('.params-section.header .form-item.optional');
            const { display } = getComputedStyle(container);
            assert.equal(display, 'flex');
          });
  
          it('does not render the toggle button for all required', async () => {
            const method = store.lookupOperation(model, '/required-headers', 'get');
            const element = await hideOptionalFixture(model, method['@id']);
            const toggle = element.shadowRoot.querySelector('.params-section.header .toggle-optional-switch');
            assert.notOk(toggle, 'toggle is not rendered');
            const allItems = element.shadowRoot.querySelectorAll('.params-section.header .form-item');
            Array.from(allItems).forEach((node) => {
              const { display } = getComputedStyle(node);
              assert.equal(display, 'flex');
            });
          });
        });
      });

      describe('Body editing', () => {
        describe('Value settings', () => {
          /** @type AmfDocument */
          let model;
          before(async () => {
            model = await store.getGraph(compact, demoApi);
          });

          it('sets value from a RAML example for a JSON body', async () => {
            const method = store.lookupOperation(model, '/body-types/json', 'post');
            const element = await modelFixture(model, method['@id']);
            const request = element.serialize();
            const data = JSON.parse(String(request.payload));
            assert.equal(data.name, 'Pawel Psztyc');

            const bodyEditor = element.shadowRoot.querySelector('body-raw-editor');
            assert.equal(bodyEditor.contentType, 'application/json', 'body editor has the content type');
          });

          it('sets value from a RAML example for an XML body', async () => {
            const method = store.lookupOperation(model, '/body-types/xml', 'post');
            const element = await modelFixture(model, method['@id']);
            const request = element.serialize();
            const body = String(request.payload);
            assert.include(body, '<name>Pawel Psztyc</name>');

            const bodyEditor = element.shadowRoot.querySelector('body-raw-editor');
            assert.equal(bodyEditor.contentType, 'application/xml', 'body editor has the content type');
          });

          it('sets value from a RAML example for an x-www-form-urlencoded body', async () => {
            const method = store.lookupOperation(model, '/body-types/form', 'post');
            const element = await modelFixture(model, method['@id']);
            const request = element.serialize();
            const body = String(request.payload);
            assert.include(body, 'name=Pawel+Psztyc');

            const bodyEditor = element.shadowRoot.querySelector('body-formdata-editor');
            assert.ok(bodyEditor, 'renders the specialized form data editor');
          });

          // this can be done by adding support for a new media type in the `api-schema` module.
          // for now an empty FormData instance is created
          it('it has no example values for form data', async () => {
            const method = store.lookupOperation(model, '/body-types/multi-parts', 'post');
            const element = await modelFixture(model, method['@id']);
            const request = element.serialize();
            assert.typeOf(request.payload, 'FormData');

            const bodyEditor = element.shadowRoot.querySelector('body-multipart-editor');
            assert.ok(bodyEditor, 'renders the specialized multipart editor');
          });

          it('sets a generated from schema example', async () => {
            const method = store.lookupOperation(model, '/generated-example', 'post');
            const element = await modelFixture(model, method['@id']);
            const request = element.serialize();
            const data = JSON.parse(String(request.payload));
            assert.typeOf(data.birthday, 'string', 'a date property is set');
            assert.isNotEmpty(data.birthday, 'a date property has a value');
            assert.equal(data.name, 'John Smith', 'has generated schema value');
          });

          it('renders media type selector', async () => {
            const method = store.lookupOperation(model, '/generated-example', 'post');
            const element = await modelFixture(model, method['@id']);
            
            const container = element.shadowRoot.querySelector('.payload-mime-selector');
            assert.ok(container, 'has the media selector container');

            const options = container.querySelectorAll('anypoint-radio-button');
            assert.lengthOf(options, 3, 'has all defined in the API media types');

            assert.equal(options[0].textContent.trim(), 'application/json', 'has the application/json option');
            assert.equal(options[1].textContent.trim(), 'application/xml', 'has the application/xml option');
            assert.equal(options[2].textContent.trim(), 'application/x-www-form-urlencoded', 'has the application/x-www-form-urlencoded option');
          });

          it('changes selected mime type', async () => {
            const method = store.lookupOperation(model, '/generated-example', 'post');
            const element = await modelFixture(model, method['@id']);
            
            const options = /** @type NodeListOf<HTMLElement> */ (element.shadowRoot.querySelectorAll('.payload-mime-selector anypoint-radio-button'));
            options[1].click();

            await nextFrame();

            const request = element.serialize();
            const body = String(request.payload);
            assert.include(body, '<url></url>');

            const bodyEditor = element.shadowRoot.querySelector('body-raw-editor');
            assert.equal(bodyEditor.contentType, 'application/xml', 'body editor has the content type');
          });
        });

        describe('apic-169', () => {
          /** @type AmfDocument */
          let model;
          before(async () => {
            model = await store.getGraph(compact, 'apic-169');
          });

          it('sets the value with optional and generated', async () => {
            const method = store.lookupOperation(model, '/new', 'post');
            const element = await modelFixture(model, method['@id']);
            const request = element.serialize();
            const data = JSON.parse(String(request.payload));
            assert.equal(data.name, 'MuleSoft');
          });
        });

        describe('APIC-480', () => {
          /** @type AmfDocument */
          let model;
          before(async () => {
            model = await store.getGraph(compact, 'APIC-480');
          });

          it('sets the content type of the operation', async () => {
            const method = store.lookupOperation(model, '/accounts/{accountNumber}', 'patch');
            const element = await modelFixture(model, method['@id']);
            const request = element.serialize();
            assert.equal(request.headers, 'content-type: application/json');
          });
        });

        describe('APIC-613', () => {
          /** @type AmfDocument */
          let model;
          before(async () => {
            model = await store.getGraph(compact, 'APIC-613');
          });

          it('should not reset input fields when manipulating them', async () => {
            const method = store.lookupOperation(model, '/files', 'post');
            const element = await modelFixture(model, method['@id']);
            
            const editor = element.shadowRoot.querySelector('body-multipart-editor');
            /** @type HTMLElement */ (editor.shadowRoot.querySelector('.add-param.text-part')).click();
            // waiting for the input to render.
            await nextFrame();

            const input = /** @type HTMLInputElement */ (editor.shadowRoot.querySelector('anypoint-input[data-property="name"]'));
            input.value = 'Test';
            input.dispatchEvent(new Event('input'));
            input.dispatchEvent(new Event('change'));

            await nextFrame();
            assert.exists(editor.shadowRoot.querySelector('anypoint-input[data-property="name"]'));
          });
        });
      });
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
      assert.isTrue(element.serverSelectorHidden);
    });

    it('sets hidden attribute to server selector', async () => {
      const serverSelector = element.shadowRoot.querySelector('api-server-selector');
      assert.exists(serverSelector);
      assert.isTrue(serverSelector.hasAttribute('hidden'));
    });

    it('has 2 servers', async () => {
      element.allowCustomBaseUri = true;
      await nextFrame();
      assert.equal(element.serversCount, 2);
    });

    it('does not hide server selector', async () => {
      element.allowCustomBaseUri = true;
      await nextFrame();
      assert.isFalse(element.serverSelectorHidden);
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
      assert.isTrue(element.serverSelectorHidden);
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
      assert.isFalse(element.serverSelectorHidden);
    });

    it('hides the selector', async () => {
      const element = await customBaseUriSlotFixture();
      element.allowCustomBaseUri = true;
      await nextFrame();
      element.noServerSelector = true
      await nextFrame()
      assert.isTrue(element.serverSelectorHidden);
      const serverSelector = element.shadowRoot.querySelector('api-server-selector');
      assert.exists(serverSelector);
      assert.isTrue(serverSelector.hasAttribute('hidden'));
    });
  });

  [true, false].forEach((compact) => {
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

    describe(compact ? 'Compact model' : 'Full model', () => {
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

  [true, false].forEach((compact) => {
    describe(compact ? 'Compact model' : 'Full model', () => {
      describe(`Populating annotated fields`, () => {
        const annotatedParametersApi = 'annotated-parameters';
        
        /** @type AmfDocument */
        let model;
        before(async () => {
          model = await store.getGraph(compact, annotatedParametersApi);
        });
        /** @type ApiRequestEditorElement */
        let element;
        beforeEach(async () => {
          InputCache.globalValues.clear();
          const selected = store.lookupOperation(model, '/test', 'get')['@id'];
          element = await modelFixture(model, selected);
        });
  
        it('should populate annotated query parameter field', () => {
          const detail = { values: [{ annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value' }] };
          document.dispatchEvent(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
          const values = [];
          element.parametersValue.forEach((p) => {
            if (p.parameter.binding !== 'query') {
              return;
            }
            values[values.length] = InputCache.get(element, p.paramId, false);
          })
          assert.deepEqual(values, ['', 'test value']);
        });
  
        it('should populate annotated header field', () => {
          const detail = { values: [{ annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value' }] };
          document.dispatchEvent(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
          const values = [];
          element.parametersValue.forEach((p) => {
            if (p.parameter.binding !== 'header') {
              return;
            }
            values[values.length] = InputCache.get(element, p.paramId, false);
          });
          assert.deepEqual(values, [ 'test value', '' ]);
          const { headers } = element.serialize();
          assert.equal(headers, 'annotatedHeader: test value\nnormalHeader: ');
        });
  
        it('should populate annotated query parameter and header fields', () => {
          const detail = { values: [
            { annotationName: 'credentialType', annotationValue: 'id', fieldValue: 'test value 1' },
            { annotationName: 'credentialType', annotationValue: 'secret', fieldValue: 'test value 2' },
          ] };
          document.dispatchEvent(new CustomEvent('populate_annotated_fields', { detail, bubbles: true }));
          const { headers, url } = element.serialize();
          assert.equal(headers, 'annotatedHeader: test value 2\nnormalHeader: ');
          assert.include(url, 'normalQueryparam=&annotatedQueryParam=test+value+1');
        });
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
