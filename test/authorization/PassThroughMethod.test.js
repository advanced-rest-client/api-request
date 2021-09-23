import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../../amf-authorization-method.js';
import { TestHelper } from '../TestHelper.js';

/** @typedef {import('@api-client/amf-store/worker.index').AmfStoreService} AmfStoreService */
/** @typedef {import('@api-client/amf-store/worker.index').ApiParametrizedSecuritySchemeRecursive} ApiParametrizedSecuritySchemeRecursive */
/** @typedef {import('@anypoint-web-components/anypoint-input').AnypointInput} AnypointInput */
/** @typedef {import('../../').AmfAuthorizationMethodElement} AmfAuthorizationMethodElement */

describe('Pass Through authorization', () => {
  /**
   * @param {ApiParametrizedSecuritySchemeRecursive=} security
   * @return {Promise<AmfAuthorizationMethodElement>} 
   */
  async function methodFixture(security) {
    return (fixture(html`<amf-authorization-method 
      type="Pass Through" 
      .security="${security}"
    ></amf-authorization-method>`));
  }

  /** @type AmfStoreService */
  let store;
  before(async () => {
    store = await TestHelper.getModelStore('secured-api', 'RAML 1.0');
  });

  after(async () => {
    store.worker.terminate();
  });

  /**
   * @param {string} path
   * @param {string} method
   * @returns {Promise<ApiParametrizedSecuritySchemeRecursive>} 
   */
  async function getApiParametrizedSecurityScheme(path, method) {
    const operation = await store.getOperationRecursive(method, path);
    return operation.security[0].schemes[0];
  }

  describe('initialization', () => {
    it('can be initialized in a template with model', async () => {
      const operation = await store.getOperationRecursive('get', '/passthrough');
      const element = await methodFixture(operation.security[0]);
      await aTimeout(0);
      assert.ok(element);
    });
  });

  describe('content rendering', () => {
    it('renders headers', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const nodes = element.shadowRoot.querySelectorAll(`anypoint-input[data-binding="header"]`);
      assert.lengthOf(nodes, 1);
    });

    it('renders query parameters', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const nodes = element.shadowRoot.querySelectorAll(`[data-binding="query"]`);
      assert.lengthOf(nodes, 2);
    });

    it('renders scheme title', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector(`.subtitle`);
      const result = node.textContent.trim();
      assert.equal(result, 'Scheme: passthrough');
    });

    it('renders scheme docs toggle button', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector(`.subtitle .hint-icon`);
      assert.ok(node);
    });

    it('ignores other security schemes', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/basic', 'get');
      const element = await methodFixture(scheme);
      const nodes = element.shadowRoot.querySelectorAll(`anypoint-input`);
      assert.lengthOf(nodes, 0);
    });
  });

  describe('description rendering', () => {
    it('does not render scheme description by default', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector(`.subtitle`);
      const next = node.nextElementSibling;
      assert.equal(next.localName, 'form');
    });

    it('renders scheme description after activation', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const button = element.shadowRoot.querySelector(`.subtitle .hint-icon`);
      /** @type HTMLElement */ (button).click();
      await nextFrame();
      const node = element.shadowRoot.querySelector(`.subtitle`);
      const next = node.nextElementSibling;
      assert.isTrue(next.classList.contains('docs-container'));
    });
  });

  describe('change notification', () => {
    it('notifies when value change', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="api_key"]`));
      input.value = 'test';
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      input.dispatchEvent(new CustomEvent('change'));
      assert.isTrue(spy.called);
    });

    it('notifies when selection change', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const input = element.shadowRoot.querySelector(`[name="debugTokenParam"]`);
      const option = input.querySelector(`[data-value="Log"]`);
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      /** @type HTMLElement */ (option).click();
      assert.isTrue(spy.called);
    });
  });

  describe('updateQueryParameter()', () => {
    it('updates query parameter value', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      element.updateQueryParameter('debugTokenParam', 'Log');
      const result = element.serialize();
      assert.equal(result.query.debugTokenParam, 'Log');
    });

    it('updates string value', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      element.updateQueryParameter('query', 'test');
      const result = element.serialize();
      assert.equal(result.query.query, 'test');
    });
  });

  describe('updateHeader()', () => {
    it('updates header value', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      element.updateHeader('api_key', 'testHeader');
      const result = element.serialize();
      assert.equal(result.header.api_key, 'testHeader');
    });
  });

  describe('restore()', () => {
    it('restores configuration from previously serialized values', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const values = {
        header: {
          api_key: 'test-restore-header'
        },
        query: {
          debugTokenParam: 'Warning',
          query: 'xxx'
        }
      };
      element.restore(values);
      const result = element.serialize();
      assert.equal(result.header.api_key, 'test-restore-header');
      assert.equal(result.query.debugTokenParam, 'Warning');
      assert.equal(result.query.query, 'xxx');
    });

    it('ignores non existing model items`', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      const values = {
        header: {
          other: 'test'
        },
        query: {
          other: 'test'
        }
      };
      element.restore(values);
      const result = element.serialize();
      assert.isUndefined(result.header.other);
      assert.isUndefined(result.query.other);
    });

    it('ignores when no argument', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      element.restore();
      // no error
    });
  });

  describe('Support for queryString property', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough-query-string', 'get');
      element = await methodFixture(scheme);
    });

    it('renders input filled for NodeShape', () => {
      const nodes = element.shadowRoot.querySelectorAll(`anypoint-input[data-binding="query"]`);
      assert.lengthOf(nodes, 2);
    });
  });

  describe('validate()', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough-query-string', 'get');
      element = await methodFixture(scheme);
    });

    it('returns false when required field is empty', () => {
      const result = element.validate();
      assert.isFalse(result);
    });

    it('renders optional field valid', () => {
      element.validate();
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector(`[name="queryStringProperty2"]`));
      assert.isFalse(input.invalid);
    });

    it('returns true when valid', async () => {
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector(`[name="queryStringProperty1"]`));
      input.value = '123';
      input.dispatchEvent(new CustomEvent('change'));
      await nextFrame();
      const result = element.validate();
      assert.isTrue(result);
    });
  });

  describe('a11y', () => {
    it('is accessible for custom fields (headers and qp)', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      const element = await methodFixture(scheme);
      await assert.isAccessible(element);
    });
  });

  describe('clear()', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;
    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/passthrough', 'get');
      element = await methodFixture(scheme);
    });

    it('clears headers', () => {
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector(`[name="api_key"]`));
      input.value = 'test';
      input.dispatchEvent(new CustomEvent('input'));
      element.clear();
      const params = element.serialize();
      assert.strictEqual(params.header.api_key, '');
    });

    it('clears query parameters', () => {
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector(`[name="query"]`));
      input.value = 'test';
      input.dispatchEvent(new CustomEvent('input'));
      element.clear();
      const params = element.serialize();
      assert.strictEqual(params.query.query, '');
    });
  });
});
