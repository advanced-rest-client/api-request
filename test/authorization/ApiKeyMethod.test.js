import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import sinon from 'sinon';
import { AmfLoader } from "../AmfLoader.js";
import '../../api-authorization-method.js';

/** @typedef {import('../../').ApiAuthorizationMethodElement} ApiAuthorizationMethodElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */

describe('Api Key authorization', () => {
  /**
   * @param {AmfDocument} model
   * @param {ApiParametrizedSecurityScheme=} security
   * @return {Promise<ApiAuthorizationMethodElement>} 
   */
  async function methodFixture(model, security) {
    return (fixture(html`<api-authorization-method 
      type="Api Key" 
      .amf="${model}"
      .security="${security}"
    ></api-authorization-method>`));
  }

  /** @type AmfLoader */
  let store;
  /** @type AmfDocument */
  let model;
  before(async () => {
    store = new AmfLoader();
    model = await store.getGraph(false, 'api-keys');
  });

  describe('initialization', () => {
    it('can be initialized in a template with model', async () => {
      const operation = store.getOperation(model, '/query', 'get');
      const element = await methodFixture(model, operation.security[0]);
      await aTimeout(0);
      assert.ok(element);
    });
  });

  /**
   * @param {string} path
   * @param {string} method
   * @returns {ApiParametrizedSecurityScheme} 
   */
  function getApiParametrizedSecurityScheme(path, method) {
    const operation = store.getOperation(model, path, method);
    return operation.security[0].schemes[0];
  }

  describe('content rendering', () => {
    it('renders headers', async () => {
      const scheme = getApiParametrizedSecurityScheme('/header', 'get');
      const element = await methodFixture(model, scheme);
      const nodes = element.shadowRoot.querySelectorAll(`anypoint-input[data-binding="header"]`);
      assert.lengthOf(nodes, 1);
    });

    it('renders query parameters', async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      const element = await methodFixture(model, scheme);
      const nodes = element.shadowRoot.querySelectorAll(`anypoint-input[data-binding="query"]`);
      assert.lengthOf(nodes, 1);
    });

    it('renders cookies', async () => {
      const scheme = getApiParametrizedSecurityScheme('/cookie', 'get');
      const element = await methodFixture(model, scheme);
      const nodes = element.shadowRoot.querySelectorAll(`anypoint-input[data-binding="cookie"]`);
      assert.lengthOf(nodes, 1);
    });

    // it('renders multiple schemes', async () => {
    //   const scheme = await getApiParametrizedSecurityScheme('/junction', 'get');
    //   const element = await basicFixture(scheme);
    //   const nodes = element.shadowRoot.querySelectorAll(`anypoint-input`);
    //   assert.lengthOf(nodes, 2);
    // });

    it('renders scheme title', async () => {
      const scheme = getApiParametrizedSecurityScheme('/header', 'get');
      const element = await methodFixture(model, scheme);
      const node = element.shadowRoot.querySelector(`.subtitle`);
      const result = node.textContent.trim();
      assert.equal(result, 'Scheme: Api Key');
    });
  });

  describe('change notification', () => {
    it('notifies when value change', async () => {
      const scheme = getApiParametrizedSecurityScheme('/header', 'get');
      const element = await methodFixture(model, scheme);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="client_secret"]`));
      input.value = 'test';
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      input.dispatchEvent(new CustomEvent('change'));
      assert.isTrue(spy.called);
    });

    it('notifies when cookie value change', async () => {
      const scheme = getApiParametrizedSecurityScheme('/cookie', 'get');
      const element = await methodFixture(model, scheme);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="client_secret"]`));
      input.value = 'test';
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      input.dispatchEvent(new CustomEvent('change'));
      assert.isTrue(spy.called);
    });
  });

  describe('updateQueryParameter()', () => {
    it('updates query parameter value', async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      const element = await methodFixture(model, scheme);
      element.updateQueryParameter('client_id', 'test');
      const result = element.serialize();
      assert.equal(result.query.client_id, 'test');
    });
  });

  describe('updateHeader()', () => {
    it('updates header value', async () => {
      const scheme = getApiParametrizedSecurityScheme('/header', 'get');
      const element = await methodFixture(model, scheme);
      element.updateHeader('client_secret', 'testHeader');
      const result = element.serialize();
      assert.equal(result.header.client_secret, 'testHeader');
    });
  });

  describe('updateCookie()', () => {
    it('updates cookie value', async () => {
      const scheme = getApiParametrizedSecurityScheme('/cookie', 'get');
      const element = await methodFixture(model, scheme);
      element.updateCookie('client_secret', 'secret');
      const result = element.serialize();
      assert.equal(result.cookie.client_secret, 'secret');
    });
  });

  describe('restore()', () => {
    it('restores configuration from previously serialized values', async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      const element = await methodFixture(model, scheme);
      const values = {
        query: {
          client_id: 'civ',
        }
      };
      element.restore(values);
      const result = element.serialize();
      assert.equal(result.query.client_id, 'civ');
    });

    it('ignores non existing model items', async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      const element = await methodFixture(model, scheme);
      const values = {
        query: {
          other: 'test'
        }
      };
      element.restore(values);
      const result = element.serialize();
      assert.isUndefined(result.query.other);
    });

    it('ignores when no argument', async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      const element = await methodFixture(model, scheme);
      element.restore();
      // no error
    });
  });

  describe('validate()', () => {
    /** @type ApiAuthorizationMethodElement */
    let element;
    beforeEach(async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      element = await methodFixture(model, scheme);
    });

    it('returns false when required field is empty', () => {
      const result = element.validate();
      assert.isFalse(result);
    });

    it('returns true when valid', async () => {
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="client_id"]`));
      input.value = 'test';
      input.dispatchEvent(new CustomEvent('change'));
      await nextFrame();
      const result = element.validate();
      assert.isTrue(result);
    });
  });

  describe('a11y', () => {
    it('is accessible for custom fields (headers and qp)', async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      const element = await methodFixture(model, scheme);
      await assert.isAccessible(element);
    });
  });

  describe('clear()', () => {
    it('clears headers', async () => {
      const scheme = getApiParametrizedSecurityScheme('/header', 'get');
      const element = await methodFixture(model, scheme);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="client_secret"]`));
      input.value = 'test';
      input.dispatchEvent(new CustomEvent('change'));
      element.clear();
      const params = element.serialize();
      assert.strictEqual(params.header.client_secret, '');
    });

    it('clears query parameters', async () => {
      const scheme = getApiParametrizedSecurityScheme('/query', 'get');
      const element = await methodFixture(model, scheme);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="client_id"]`));
      input.value = 'test';
      input.dispatchEvent(new CustomEvent('change'));
      element.clear();
      const params = element.serialize();
      assert.strictEqual(params.query.client_id, '');
    });

    it('clears cookie parameters', async () => {
      const scheme = getApiParametrizedSecurityScheme('/cookie', 'get');
      const element = await methodFixture(model, scheme);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="client_secret"]`));
      input.value = 'test';
      input.dispatchEvent(new CustomEvent('change'));
      element.clear();
      const params = element.serialize();
      assert.strictEqual(params.cookie.client_secret, '');
    });
  });
});
