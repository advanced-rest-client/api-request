import { fixture, assert, html } from '@open-wc/testing';
import '../../amf-authorization-method.js';
import { TestHelper } from '../TestHelper.js';

/** @typedef {import('@api-client/amf-store/worker.index').AmfStoreService} AmfStoreService */
/** @typedef {import('@api-client/amf-store/worker.index').ApiParametrizedSecuritySchemeRecursive} ApiParametrizedSecuritySchemeRecursive */
/** @typedef {import('@anypoint-web-components/anypoint-input').AnypointInput} AnypointInput */
/** @typedef {import('../../').AmfAuthorizationMethodElement} AmfAuthorizationMethodElement */

describe('OAuth 2', () => {
  /**
   * @param {ApiParametrizedSecuritySchemeRecursive=} security
   * @return {Promise<AmfAuthorizationMethodElement>} 
   */
  async function methodFixture(security) {
    return (fixture(html`<amf-authorization-method 
      type="oauth 2" 
      .security="${security}"
    ></amf-authorization-method>`));
  }

  /** @type AmfStoreService */
  let store;
  before(async () => {
    store = await TestHelper.getModelStore('oauth-pkce', 'RAML 1.0');
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

  describe('PKCE extension', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/pkce', 'get');
      element = await methodFixture(scheme);
    });

    it('sets the `pkce` property to true', () => {
      assert.isTrue(element.pkce);
    });
  });
});
