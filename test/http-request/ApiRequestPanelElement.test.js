import { fixture, assert, html } from '@open-wc/testing';
import sinon from 'sinon';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-panel.js';
import { loadMonaco } from '../MonacoSetup.js';

/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('../../').ApiRequestPanelElement} ApiRequestPanelElement */
/** @typedef {import('../../').ApiRequestEditorElement} ApiRequestEditorElement */
/** @typedef {import('../../src/types').ApiConsoleResponse} ApiConsoleResponse */

describe('ApiRequestPanelElement', () => {
  /** @type AmfLoader */
  let store;
  before(async () => {
    await loadMonaco();
    store = new AmfLoader();
  });

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function basicFixture(model, selected) {
    return fixture(html`<api-request-panel .amf="${model}" .selected="${selected}"></api-request-panel>`);
  }

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function authPopupFixture(model, selected) {
    return fixture(html`<api-request-panel .amf="${model}"  .selected="${selected}"
      authPopupLocation="test/"></api-request-panel>`);
  }

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function proxyFixture(model, selected) {
    return fixture(
      html`<api-request-panel .amf="${model}" .selected="${selected}" proxy="https://proxy.domain.com/"></api-request-panel>`
    );
  }

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function proxyEncFixture(model, selected) {
    return fixture(html`<api-request-panel
      .amf="${model}"
      .selected="${selected}"
      proxy="https://proxy.domain.com/"
      proxyEncodeUrl></api-request-panel>`);
  }

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function redirectUriFixture(model, selected) {
    return fixture(html`<api-request-panel .amf="${model}" .selected="${selected}"
      redirectUri="https://auth.domain.com/token"></api-request-panel>`);
  }

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function addHeadersFixture(model, selected) {
    const headers = [{"name": "x-test", "value": "header-value"}];
    return fixture(html`<api-request-panel .amf="${model}" .selected="${selected}" .appendHeaders="${headers}"></api-request-panel>`);
  }

  /**
   * @param {AmfDocument=} model
   * @param {string=} selected
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function navigationFixture(model, selected) {
    return fixture(
      html`<api-request-panel .amf="${model}" .selected="${selected}" handleNavigationEvents></api-request-panel>`
    );
  }

  function appendRequestData(element, request={}) {
    const editor = /** @type ApiRequestEditorElement */ (element.shadowRoot.querySelector('api-request-editor'));
    editor.url = request.url || 'https://domain.com';
    editor._httpMethod = request.method || 'get';
    editor._headers = request.headers || '';
    // editor._payload = request.payload;
  }

  describe('Initialization', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(true);
    });

    it('can be constructed with document.createElement', () => {
      const button = document.createElement('api-request-panel');
      assert.ok(button);
    });

    it('_hasResponse is false', async () => {
      const element = await basicFixture(model);
      assert.isFalse(element._hasResponse);
    });

    it('api-request is dispatched', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await basicFixture(model, method['@id']);
      appendRequestData(element);
      const spy = sinon.spy();
      element.addEventListener('api-request', spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      assert.isTrue(spy.called);
    });
  });

  describe('Redirect URI computation', () => {
    it('redirectUri has default value', async () => {
      const element = await basicFixture();
      assert.isTrue(
        element.redirectUri.indexOf(
          '@advanced-rest-client/oauth-authorization/oauth-popup.html'
        ) !== -1
      );
    });

    it('redirectUri is computed for auth-popup location', async () => {
      const element = await authPopupFixture();
      assert.isTrue(
        element.redirectUri.indexOf(
          'test/@advanced-rest-client/oauth-authorization/oauth-popup.html'
        ) !== -1
      );
    });

    it('redirectUri is not computed when redirectUri is set', async () => {
      const element = await redirectUriFixture();
      assert.isTrue(
        element.redirectUri.indexOf('https://auth.domain.com/token') !== -1
      );
    });
  });

  describe('Proxy settings', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(true);
    });

    it('Changes URL in the api-request event', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await proxyFixture(model, method['@id']);
      appendRequestData(element);
      const editor = element.shadowRoot.querySelector('api-request-editor');

      const spy = sinon.spy();
      element.addEventListener('api-request', spy);
      editor.execute();
      assert.equal(
        spy.args[0][0].detail.url,
        'https://proxy.domain.com/https://domain.com'
      );
    });

    it('Encodes original URL', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await proxyEncFixture(model, method['@id']);
      appendRequestData(element);
      const spy = sinon.spy();
      element.addEventListener('api-request', spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      assert.equal(
        spy.args[0][0].detail.url,
        'https://proxy.domain.com/https%3A%2F%2Fdomain.com'
      );
    });
  });

  describe('Headers settings', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(true);
    });

    it('Adds headers to the request', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await addHeadersFixture(model, method['@id']);
      appendRequestData(element);
      const spy = sinon.spy();
      element.addEventListener('api-request', spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      assert.equal(spy.args[0][0].detail.headers, 'x-test: header-value');
    });

    it('Should add string headers to api-request event', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await basicFixture(model, method['@id']);

      const headers = new Headers();
      headers.append('content-type', 'application/json');
      appendRequestData(element, { headers });

      const spy = sinon.spy();
      element.addEventListener('api-request', spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();

      assert.equal(spy.args[0][0].detail.headers, 'content-type: application/json');
    });

    it('Replaces headers in the request', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await addHeadersFixture(model, method['@id']);
      appendRequestData(element, {
        headers: 'x-test: other-value',
      });
      const spy = sinon.spy();
      element.addEventListener('api-request', spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      assert.equal(spy.args[0][0].detail.headers, 'x-test: header-value');
    });
  });

  describe('Response handling', () => {
    function propagate(element) {
      const detail = /** @type ApiConsoleResponse */ ({
        request: {
          url: 'https://domain.com/',
          method: 'GET',
          headers: 'accept: text/plain',
        },
        response: {
          status: 200,
          statusText: 'OK',
          payload: 'Hello world',
          headers: 'content-type: text/plain',
        },
        loadingTime: 124.12345678,
        isError: false,
      });
      element._propagateResponse(detail);
    }
    let element = /** @type ApiRequestPanelElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('request is set', () => {
      propagate(element);
      assert.typeOf(element.request, 'object');
    });

    it('response is set', () => {
      propagate(element);
      assert.typeOf(element.response, 'object');
    });

    it('Changing selection clears response', () => {
      propagate(element);
      element.selected = 'test';
      assert.isUndefined(element.request);
      assert.isUndefined(element.response);
    });

    it('Calling clearResponse() clears response', () => {
      propagate(element);
      element.clearResponse();
      assert.isUndefined(element.request);
      assert.isUndefined(element.response);
    });
  });

  describe('Automated navigation', () => {
    let element = /** @type ApiRequestPanelElement */ (null);

    beforeEach(async () => {
      element = await navigationFixture();
    });

    function dispatch(selected, type) {
      // eslint-disable-next-line no-param-reassign
      type = type || 'method';
      document.body.dispatchEvent(
        new CustomEvent('api-navigation-selection-changed', {
          detail: {
            selected,
            type,
          },
          bubbles: true,
        })
      );
    }

    it('Sets "selected" when type is "method"', () => {
      const id = '%2Ftest-parameters%2F%7Bfeature%7D/get';
      dispatch(id);
      assert.equal(element.selected, id);
    });

    it('"selected" is undefined when type is not "method"', () => {
      const id = '%2Ftest-parameters%2F%7Bfeature%7D';
      dispatch(id, 'endpoint');
      assert.isUndefined(element.selected);
    });
  });

  describe('_apiResponseHandler()', () => {
    let element = /** @type ApiRequestPanelElement */ (null);
    const requestId = 'test-id';
    beforeEach(async () => {
      element = await basicFixture();
      element.lastRequestId = requestId;
    });

    const xhrResponse = {
      request: {
        url: 'https://domain.com/',
        method: 'GET',
        headers: 'accept: text/plain',
      },
      response: {
        status: 200,
        statusText: 'OK',
        payload: 'Hello world',
        headers: 'content-type: text/plain',
      },
      loadingTime: 124.12345678,
      isError: false,
      isXhr: true,
    };

    it('Does nothing when ID is different', () => {
      const spy = sinon.spy(element, '_propagateResponse');
      const e = new CustomEvent('api-response', {
        detail: {
          id: 'otherId',
        },
      });
      element._apiResponseHandler(e);
      assert.isFalse(spy.called);
    });

    it('Calls _propagateResponse()', () => {
      const detail = { id: requestId, ...xhrResponse };
      const spy = sinon.spy(element, '_propagateResponse');
      const e = new CustomEvent('api-response', {
        detail
      });
      element._apiResponseHandler(e);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0], detail);
    });
  });
});
