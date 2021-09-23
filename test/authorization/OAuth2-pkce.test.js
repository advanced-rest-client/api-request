import { fixture, assert, html } from '@open-wc/testing';
import { AmfLoader } from "../AmfLoader.js";
import '../../api-authorization-method.js';

/** @typedef {import('../../').ApiAuthorizationMethodElement} ApiAuthorizationMethodElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */

describe('OAuth 2', () => {
  /**
   * @param {AmfDocument} model
   * @param {ApiParametrizedSecurityScheme=} security
   * @return {Promise<ApiAuthorizationMethodElement>} 
   */
  async function methodFixture(model, security) {
    return (fixture(html`<api-authorization-method 
      type="oauth 2" 
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
    model = await store.getGraph(false, 'oauth-pkce');
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

  describe('PKCE extension', () => {
    /** @type ApiAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = getApiParametrizedSecurityScheme('/pkce', 'get');
      element = await methodFixture(model, scheme);
    });

    it('sets the `pkce` property to true', () => {
      assert.isTrue(element.pkce);
    });
  });
});
