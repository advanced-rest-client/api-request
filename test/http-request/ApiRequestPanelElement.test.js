import { fixture, assert, html } from '@open-wc/testing';
import sinon from 'sinon';
import { AmfLoader } from '../AmfLoader.js';
import '../../api-request-panel.js';
import { loadMonaco } from '../MonacoSetup.js';
import { EventTypes } from '../../src/events/EventTypes.js';
import { propagateResponse, responseHandler } from '../../src/elements/ApiRequestPanelElement.js';

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

    it('hasResponse is false', async () => {
      const element = await basicFixture(model);
      assert.isFalse(element.hasResponse);
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

  describe('Proxy settings', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(true);
    });

    it('changes URL in the api request event', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await proxyFixture(model, method['@id']);
      const editor = element.shadowRoot.querySelector('api-request-editor');

      const spy = sinon.spy();
      element.addEventListener(EventTypes.Request.apiRequest, spy);
      editor.execute();
      const { url } = element.shadowRoot.querySelector('api-request-editor').serialize();
      assert.equal(
        spy.args[0][0].detail.url,
        `https://proxy.domain.com/${url}`
      );
    });

    it('encodes the original URL', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await proxyEncFixture(model, method['@id']);
      appendRequestData(element);
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Request.apiRequest, spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      const { url } = element.shadowRoot.querySelector('api-request-editor').serialize();
      assert.equal(
        spy.args[0][0].detail.url,
        `https://proxy.domain.com/${encodeURIComponent(url)}`
      );
    });
  });

  describe('Headers settings', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(true);
    });

    it('adds headers to the request', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await addHeadersFixture(model, method['@id']);
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Request.apiRequest, spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      assert.equal(spy.args[0][0].detail.headers, 'x-people-op-id: 9719fa6f-c666-48e0-a191-290890760b30\nx-test: header-value');
    });

    it('replaces headers in the request', async () => {
      const method = store.lookupOperation(model, '/people', 'get');
      const element = await addHeadersFixture(model, method['@id']);
      appendRequestData(element, {
        headers: 'x-test: other-value',
      });
      const spy = sinon.spy();
      element.addEventListener(EventTypes.Request.apiRequest, spy);
      const editor = element.shadowRoot.querySelector('api-request-editor');
      editor.execute();
      assert.equal(spy.args[0][0].detail.headers, 'x-people-op-id: 9719fa6f-c666-48e0-a191-290890760b30\nx-test: header-value');
    });
  });

  describe('Response handling', () => {
    /**
     * @param {ApiRequestPanelElement} element
     */
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
      element[propagateResponse](detail);
    }
    /** @type ApiRequestPanelElement */
    let element;
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

  describe('[responseHandler]()', () => {
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
      const spy = sinon.spy(element, propagateResponse);
      const e = new CustomEvent(EventTypes.Request.apiResponse, {
        detail: {
          id: 'otherId',
        },
      });
      // @ts-ignore
      element[responseHandler](e);
      assert.isFalse(spy.called);
    });

    it('Calls _propagateResponse()', () => {
      const detail = { id: requestId, ...xhrResponse };
      const spy = sinon.spy(element, propagateResponse);
      const e = new CustomEvent(EventTypes.Request.apiResponse, {
        detail
      });
      element[responseHandler](e);
      assert.isTrue(spy.called);
      assert.deepEqual(spy.args[0][0], detail);
    });
  });
});
