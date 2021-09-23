import { fixture, assert, nextFrame, html } from '@open-wc/testing';
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

  /**
   * @param {AmfDocument} model
   * @return {Promise<ApiAuthorizationMethodElement>} 
   */
  async function basicFixture(model) {
    return (fixture(html`<api-authorization-method 
      .amf="${model}"
      type="oauth 2" 
    ></api-authorization-method>`));
  }

  /** @type AmfLoader */
  let store;
  /** @type AmfDocument */
  let model;
  before(async () => {
    store = new AmfLoader();
    model = await store.getGraph(false, 'oauth-flows');
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

  describe('OAS grant types (flows)', () => {
    /** @type ApiAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = getApiParametrizedSecurityScheme('/pets', 'patch');
      element = await methodFixture(model, scheme);
    });

    it('renders all defined grant types', () => {
      const implicit = element.grantTypes.find(i => i.type === 'implicit');
      const code = element.grantTypes.find(i => i.type === 'authorization_code');
      const credentials = element.grantTypes.find(i => i.type === 'client_credentials');
      const password = element.grantTypes.find(i => i.type === 'password');
      assert.ok(implicit, 'has the implicit grant type');
      assert.ok(code, 'has the authorization_code grant type');
      assert.ok(credentials, 'has the client_credentials grant type');
      assert.ok(password, 'has the password grant type');
    });

    it('initializes first flow by default', () => {
      assert.equal(element.grantType, 'implicit');
    });

    it('applies configuration when initializing', () => {
      assert.equal(
        element.authorizationUri,
        'https://api.example.com/oauth2/authorize',
        'authorizationUri is set'
      );
      assert.deepEqual(
        element.scopes,
        ['read_pets', 'write_pets'],
        'scopes is set'
      );
    });

    it('applies configuration on grant type change', async () => {
      element.grantType = 'authorization_code';
      await nextFrame();
      assert.equal(
        element.authorizationUri,
        '/oauth2/authorize',
        'authorizationUri is set'
      );
      assert.equal(
        element.accessTokenUri,
        '/oauth2/token',
        'accessTokenUri is set'
      );
      assert.deepEqual(
        element.scopes,
        ['all'],
        'scopes is set'
      );
    });

    it('restores configuration when grant type is selected', async () => {
      element = await basicFixture(model);
      element.grantType = 'authorization_code';
      await nextFrame();
      element.security = getApiParametrizedSecurityScheme('/pets', 'patch');
      await nextFrame();
      assert.equal(
        element.grantType,
        'authorization_code',
        'grantType is not changed'
      );
      assert.equal(
        element.authorizationUri,
        '/oauth2/authorize',
        'authorizationUri is set'
      );
      assert.equal(
        element.accessTokenUri,
        '/oauth2/token',
        'accessTokenUri is set'
      );
      assert.deepEqual(
        element.scopes,
        ['all'],
        'scopes is set'
      );
    });

    it('applies client credentials grant type', async () => {
      element.grantType = 'client_credentials';
      await nextFrame();
      assert.equal(element.accessTokenUri, '/oauth2/token-client', 'accessTokenUri is set');
      assert.include(element.scopes, 'write_pets', 'has write_pets scope');
      assert.include(element.scopes, 'read_pets', 'has read_pets scope');
    });

    it('applies password grant type', async () => {
      element.grantType = 'password';
      await nextFrame();
      assert.equal(element.accessTokenUri, '/oauth2/token-password', 'accessTokenUri is set');
      assert.deepEqual(element.scopes, ['read_pets'], 'scopes is set');
    });
  });
});
