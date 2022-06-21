import { fixture, assert, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../api-request-panel.js';

/** @typedef {import('..').ApiRequestPanelElement} ApiRequestPanelElement */
/** @typedef {import('..').ApiRequestEditorElement} ApiRequestEditorElement */
/** @typedef {import('../src/types').ApiConsoleResponse} ApiConsoleResponse */

describe('ApiRequestPanelElement', () => {
  /**
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function basicFixture() {
    return fixture(html`<api-request-panel></api-request-panel>`);
  }

  /**
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function authPopupFixture() {
    return fixture(html`<api-request-panel
      authPopupLocation="test/"></api-request-panel>`);
  }

  /**
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function proxyFixture() {
    return fixture(
      html`<api-request-panel proxy="https://proxy.domain.com/"></api-request-panel>`
    );
  }

  /**
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function proxyEncFixture() {
    return fixture(html`<api-request-panel
      proxy="https://proxy.domain.com/"
      proxyEncodeUrl></api-request-panel>`);
  }

  /**
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function redirectUriFixture() {
    return fixture(html`<api-request-panel
      redirectUri="https://auth.domain.com/token"></api-request-panel>`);
  }

  /**
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function addHeadersFixture() {
    const headers = [{"name": "x-test", "value": "header-value"}];
    return fixture(html`<api-request-panel .appendHeaders="${headers}"></api-request-panel>`);
  }

  /**
   * @returns {Promise<ApiRequestPanelElement>}
   */
  async function navigationFixture() {
    return fixture(
      html`<api-request-panel handleNavigationEvents></api-request-panel>`
    );
  }

  function appendRequestData(element, request={}) {
    const editor = /** @type ApiRequestEditorElement */ (element.shadowRoot.querySelector('api-request-editor'));
    editor.url = request.url || 'https://domain.com';
    editor._httpMethod = request.method || 'get';
    editor._headers = request.headers || '';
    editor._payload = request.payload;
  }

  describe('Initialization', () => {
    it('can be constructed with document.createElement', () => {
      const button = document.createElement('api-request-panel');
      assert.ok(button);
    });

    it('_hasResponse is false', async () => {
      const element = await basicFixture();
      assert.isFalse(element._hasResponse);
    });

    it('api-request is dispatched', async () => {
      const element = await basicFixture();
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
    it('Changes URL in the api-request event', async () => {
      const element = await proxyFixture();
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
      const element = await proxyEncFixture();
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
    it('Adds headers to the request', async () => {
      const element = await addHeadersFixture();
      appendRequestData(element);
      const spy = sinon.spy();
      element.addEventListener('api-request', spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      assert.equal(spy.args[0][0].detail.headers, 'x-test: header-value');
    });

    it('Should add string headers to api-request event', async () => {
      const element = await basicFixture();

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
      const element = await addHeadersFixture();
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
    function propagate(element, payload, headers = 'accept: text/plain') {
      const detail = /** @type ApiConsoleResponse */ ({
        request: {
          url: 'https://domain.com/',
          method: 'GET',
          headers,
        },
        response: {
          status: 200,
          statusText: 'OK',
          payload: payload || 'Hello world',
          headers,
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

    it('sanitize HTML payload if needed', () => {
      const payload = '<svg xmlns="http://www.w3.org/2000/svg">; <foreignObject> <iframe srcdoc="&lt;script src=\'data:text/javascript,alert(document.domain)\'&gt;&lt;/script&gt;" /> </foreignObject></svg>'
      propagate(element, payload, 'content-type: image/svg+xml');
      assert.typeOf(element.response, 'object');
      assert.equal(element.response.payload, '<svg xmlns="http://www.w3.org/2000/svg">; </svg>');
    });

    it('does not sanitize HTML payload if valid', () => {
      const stringPayload = 'Any string'
      propagate(element, stringPayload);
      assert.typeOf(element.response, 'object');
      assert.equal(element.response.payload, stringPayload);

      const objectStringPayload = '{"test":"object"}'
      propagate(element, objectStringPayload);
      assert.typeOf(element.response, 'object');
      assert.equal(element.response.payload, objectStringPayload);
    });

    it('should not sanitize payload if content type is XML', () => {
      const payload = '<svg xmlns="http://www.w3.org/2000/svg">; <foreignObject> <iframe srcdoc="&lt;script src=\'data:text/javascript,alert(document.domain)\'&gt;&lt;/script&gt;" /> </foreignObject></svg>'
      propagate(element, payload, 'content-type: application/xml');
      assert.typeOf(element.response, 'object');
      assert.equal(element.response.payload, payload);
    })
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
