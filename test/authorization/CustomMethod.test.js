import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../../amf-authorization-method.js';
import { TestHelper } from '../TestHelper.js';

/** @typedef {import('@api-client/amf-store/worker.index').AmfStoreService} AmfStoreService */
/** @typedef {import('@api-client/amf-store/worker.index').ApiParametrizedSecuritySchemeRecursive} ApiParametrizedSecuritySchemeRecursive */
/** @typedef {import('@anypoint-web-components/anypoint-input').AnypointInput} AnypointInput */
/** @typedef {import('../../').AmfAuthorizationMethodElement} AmfAuthorizationMethodElement */

describe('RAML custom scheme', () => {
  /**
   * @param {ApiParametrizedSecuritySchemeRecursive=} security
   * @return {Promise<AmfAuthorizationMethodElement>} 
   */
  async function methodFixture(security) {
    return (fixture(html`<amf-authorization-method 
      type="custom" 
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
      const operation = await store.getOperationRecursive('get', '/custom2');
      const element = await methodFixture(operation.security[0]);
      await aTimeout(0);
      assert.ok(element);
    });
  });

  describe('content rendering', () => {
    it('renders headers', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      const nodes = element.shadowRoot.querySelectorAll(`[data-binding="header"]`);
      assert.lengthOf(nodes, 1);
    });

    it('renders query parameters', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom2', 'get');
      const element = await methodFixture(scheme);
      const nodes = element.shadowRoot.querySelectorAll(`[data-binding="query"]`);
      assert.lengthOf(nodes, 2);
    });

    it('renders scheme title', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector(`.subtitle`);
      const result = node.textContent.trim();
      assert.equal(result, 'Scheme: custom1');
    });

    it('renders scheme desc toggle button', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector(`.subtitle .hint-icon`);
      assert.ok(node);
    });

    it('ignores other security schemes', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/basic', 'get');
      const element = await methodFixture(scheme);
      const nodes = element.shadowRoot.querySelectorAll(`[data-binding="header"]`);
      assert.lengthOf(nodes, 0);
    });
  });

  describe('description rendering', () => {
    it('does not render scheme description by default', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector(`.subtitle`);
      const next = node.nextElementSibling;
      assert.equal(next.localName, 'form');
    });

    it('renders scheme description after activation', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
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
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="SpecialTokenHeader"]`));
      input.value = 'test';
      const spy = sinon.spy();
      element.addEventListener('change', spy);
      input.dispatchEvent(new CustomEvent('change'));
      assert.isTrue(spy.called);
    });

    it('notifies when selection change', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
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
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      element.updateQueryParameter('debugTokenParam', 'Log');
      const result = element.serialize();
      assert.equal(result.query.debugTokenParam, 'Log');
    });

    it('updates boolean value', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      element.updateQueryParameter('booleanTokenParam', 'false');
      const result = element.serialize();
      assert.equal(result.query.booleanTokenParam, 'false');
    });

    it('updates string value', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom2', 'get');
      const element = await methodFixture(scheme);
      element.updateQueryParameter('apiNonceParam', 'test');
      const result = element.serialize();
      assert.equal(result.query.apiNonceParam, 'test');
    });
  });

  describe('updateHeader()', () => {
    it('updates header value', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      element.updateHeader('SpecialTokenHeader', 'testHeader');
      const result = element.serialize();
      assert.equal(result.header.SpecialTokenHeader, 'testHeader');
    });
  });

  describe('restore()', () => {
    it('restores configuration from previously serialized values', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      const values = {
        header: {
          SpecialTokenHeader: 'test-restore-header'
        },
        query: {
          debugTokenParam: 'Warning',
          booleanTokenParam: 'false'
        }
      };
      element.restore(values);
      const result = element.serialize();
      assert.equal(result.header.SpecialTokenHeader, 'test-restore-header');
      assert.equal(result.query.debugTokenParam, 'Warning');
      assert.equal(result.query.booleanTokenParam, 'false');
    });

    it('ignores non existing model items`', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
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

    it('ignores when no models', async () => {
      const element = await methodFixture(undefined);
      const values = {
        header: {
          SpecialTokenHeader: 'test-restore-header'
        },
      };
      element.restore(values);
      const result = element.serialize();
      assert.deepEqual(result, {});
    });

    it('ignores when no argument', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      element.restore();
      // no error
    });
  });

  describe('Support for queryString property', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom3', 'get');
      element = await methodFixture(scheme);
    });

    it('renders input filled for NodeShape', () => {
      const nodes = element.shadowRoot.querySelectorAll(`[data-binding="query"]`);
      assert.lengthOf(nodes, 2);
    });
  });

  describe('validate()', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom3', 'get');
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
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector(`[name="queryStringProperty1"]`));
      input.value = '123';
      input.dispatchEvent(new CustomEvent('change'));
      await nextFrame();
      const result = element.validate();
      assert.isTrue(result);
    });
  });

  describe('a11y', () => {
    it('is accessible for custom fields (headers and qp)', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/custom1', 'get');
      const element = await methodFixture(scheme);
      await assert.isAccessible(element);
    });
  });
});
