import { fixture, assert, nextFrame, html } from '@open-wc/testing';
import {
  oauth2GrantTypes,
} from '@advanced-rest-client/authorization/src/Oauth2MethodMixin.js';
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

  /**
   * @return {Promise<AmfAuthorizationMethodElement>} 
   */
  async function basicFixture() {
    return (fixture(html`<amf-authorization-method 
      type="oauth 2" 
    ></amf-authorization-method>`));
  }

  /** @type AmfStoreService */
  let store;
  before(async () => {
    store = await TestHelper.getModelStore('oauth-flows', 'OAS 3.0');
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

  describe('OAS grant types (flows)', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/pets', 'patch');
      element = await methodFixture(scheme);
    });

    it('renders all defined grant types', () => {
      assert.deepEqual(element.grantTypes, oauth2GrantTypes);
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
      element = await basicFixture();
      element.grantType = 'authorization_code';
      await nextFrame();
      const operation = await store.getOperationRecursive('patch', '/pets');
      element.security = operation.security[0].schemes[0];
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
