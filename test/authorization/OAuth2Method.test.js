import { fixture, assert, aTimeout, nextFrame, html } from '@open-wc/testing';
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
    it('can be initialized with document.createElement', () => {
      const element = document.createElement('amf-authorization-method');
      assert.ok(element);
    });

    it('can be initialized in a template with model', async () => {
      const operation = await store.getOperationRecursive('post', '/oauth2');
      const element = await methodFixture(operation.security[0]);
      await aTimeout(0);
      assert.ok(element);
    });
  });

  describe('setting API data', () => {
    it('sets default authorization grants', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      assert.deepEqual(element.grantTypes, oauth2GrantTypes);
    });

    it('sets API defined grant types', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-with-grant-list', 'get');
      const element = await methodFixture(scheme);
      assert.deepEqual(element.grantTypes, [{
        type: 'authorization_code',
        label: 'Authorization code (server flow)'
      }]);
    });

    it('changes grant types list when endpoint changes', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-with-grant-list', 'get');
      const element = await methodFixture(scheme);
      const operation = await store.getOperationRecursive('post', '/oauth2');
      const scheme2 = operation.security[0].schemes[0];
      element.security = scheme2;
      await nextFrame();
      assert.deepEqual(element.grantTypes, oauth2GrantTypes);
    });

    it('selects first available grant type', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-with-grant-list', 'get');
      const element = await methodFixture(scheme);
      assert.equal(element.grantType, 'authorization_code');
    });

    it('sets authorizationUri', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      assert.equal(element.authorizationUri, 'https://auth.com');
    });

    it('sets accessTokenUri', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      assert.equal(element.accessTokenUri, 'https://token.com');
    });

    it('sets scopes', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      assert.deepEqual(element.scopes, ['profile', 'email']);
    });

    it('automatically hides advanced properties when filled', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector('.advanced-section');
      assert.isTrue(node.hasAttribute('hidden'));
    });

    it('should not show pkce checkbox if selected grant type is not authorization_code', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      /* Default grant type selected is Access Token for this endpoint */
      /* Check it just in case */
      assert.equal(element.grantType, 'implicit');
      const node = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.adv-toggle anypoint-switch'));
      node.click();
      await nextFrame();
      const pkceCheckbox = element.shadowRoot.querySelector('.advanced-section').querySelector('anypoint-checkbox');
      assert.notExists(pkceCheckbox);
    });

    it('should show pkce checkbox unchecked by default in advanced settings with authorization_code selected', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      element.grantType = 'authorization_code';
      const node = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.adv-toggle anypoint-switch'));
      node.click();
      await nextFrame();
      const pkceCheckbox = element.shadowRoot.querySelector('.advanced-section').querySelector('anypoint-checkbox');
      // @ts-ignore
      assert.isFalse(pkceCheckbox.checked);
    });

    const customSelector = '[data-binding="authQuery"],[data-binding="tokenQuery"],[data-binding="tokenHeader"],[data-binding="tokenBody"]';

    it('does not render annotation inputs when are not defined', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2', 'post');
      const element = await methodFixture(scheme);
      const node = element.shadowRoot.querySelector(customSelector);
      assert.notOk(node);
    });

    it('renders annotation inputs when defined', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-with-annotations', 'get');
      const element = await methodFixture(scheme);
      const nodes = element.shadowRoot.querySelectorAll(customSelector);
      assert.lengthOf(nodes, 8);
    });

    it('sets oauthDeliveryMethod to header when available', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-header-delivery', 'get');
      const element = await methodFixture(scheme);
      assert.equal(element.oauthDeliveryMethod, 'header');
      assert.equal(element.oauthDeliveryName, 'token');
    });

    it('sets oauthDeliveryMethod to query when available', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-query-delivery', 'get');
      const element = await methodFixture(scheme);

      assert.equal(element.oauthDeliveryMethod, 'query');
      assert.equal(element.oauthDeliveryName, 'access_token');
    });

    it('sets default oauthDeliveryMethod', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-no-delivery', 'get');
      const element = await methodFixture(scheme);

      assert.equal(element.oauthDeliveryMethod, 'header');
      assert.equal(element.oauthDeliveryName, 'authorization');
    });

    it('resets state when incompatible settings', async () => {
      const scheme = await getApiParametrizedSecurityScheme('/basic', 'get');
      const element = await methodFixture(scheme);
      assert.deepEqual(element.grantTypes, oauth2GrantTypes, 'grant types are set');
      assert.equal(element.oauthDeliveryMethod, 'header', 'oauthDeliveryMethod is set');
      assert.equal(element.oauthDeliveryName, 'authorization', 'oauthDeliveryName is set');
    });
  });

  describe('annotation data changing', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-with-annotations', 'get');
      element = await methodFixture(scheme);
      element.grantType = 'authorization_code';
      await nextFrame();
    });

    it('updates query parameter on authorization request', async () => {
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector('anypoint-input[name="numericParam"]'));
      input.value = 10;
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      const param = info.customData.auth.parameters.find(i => i.name === 'numericParam');
      assert.equal(param.value, '10');
    });

    it('updates array value', async () => {
      const button = /** @type HTMLButtonElement */ (element.shadowRoot.querySelector('[data-param-label="repeatableParam1"] anypoint-button'));
      button.click();
      await nextFrame();
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector('anypoint-input[name="repeatableParam1"]'));
      input.value = ['test'];
      input.dispatchEvent(new Event('change'));
      await nextFrame();
      const info = element.serialize();
      const param = info.customData.auth.parameters.find(i => i.name === 'repeatableParam1');
      assert.deepEqual(param.value, ['test']);
    });

    it('updates query parameter on token request', async () => {
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector('anypoint-input[name="queryTokenResource"]'));
      input.value = 'test';
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      assert.equal(info.customData.token.parameters[0].value, 'test');
    });

    it('updates header on token request', async () => {
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector('anypoint-input[name="x-token-resource"]'));
      input.value = '123';
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      assert.equal(info.customData.token.headers[0].value, '123');
    });

    it('updates header on token request (other?)', async () => {
      const input = /** @type AnypointInput */ (element.shadowRoot.querySelector('anypoint-input[name="bodyTokenResource"]'));
      input.value = 'test';
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      assert.equal(info.customData.token.body[0].value, 'test');
    });
  });

  describe('serialize()', () => {
    /** @type AmfAuthorizationMethodElement */
    let element;

    beforeEach(async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth2-with-annotations', 'get');
      element = await methodFixture(scheme);
    });

    it('serializes implicit data', async () => {
      element.grantType = 'implicit';
      await nextFrame();
      const info = element.serialize();
      assert.typeOf(info.customData.auth.parameters, 'array');
      assert.lengthOf(info.customData.auth.parameters, 1);
    });

    it('has no token properties for implicit data', async () => {
      element.grantType = 'implicit';
      await nextFrame();
      const info = element.serialize();
      assert.isUndefined(info.customData.token.parameters);
      assert.isUndefined(info.customData.token.headers);
      assert.isUndefined(info.customData.token.body);
    });

    it('serializes authorization code data', async () => {
      element.grantType = 'authorization_code';
      await nextFrame();
      const input = element.shadowRoot.querySelector('anypoint-input[name="queryTokenResource"]');
      // @ts-ignore
      input.value = 'test';
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      assert.typeOf(info.customData.token.parameters, 'array');
      assert.lengthOf(info.customData.token.parameters, 1);

      assert.isUndefined(element.pkce, 'pkce is not set');
    });
    

    it('serializes client credentials data', async () => {
      element.grantType = 'client_credentials';
      await nextFrame();
      const input = element.shadowRoot.querySelector('anypoint-input[name="queryTokenResource"]');
      // @ts-ignore
      input.value = 'test';
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      assert.typeOf(info.customData.token.parameters, 'array');
      assert.lengthOf(info.customData.token.parameters, 1);
    });

    it('serializes password data', async () => {
      element.grantType = 'password';
      await nextFrame();
      const input = element.shadowRoot.querySelector('anypoint-input[name="queryTokenResource"]');
      // @ts-ignore
      input.value = 'test';
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      assert.typeOf(info.customData.token.parameters, 'array');
      assert.lengthOf(info.customData.token.parameters, 1);
    });

    it('serializes custom grant data', async () => {
      element.grantType = 'annotated_custom_grant';
      await nextFrame();
      const input = element.shadowRoot.querySelector('anypoint-input[name="queryTokenResource"]');
      // @ts-ignore
      input.value = 'test';
      input.dispatchEvent(new Event('change'));
      const info = element.serialize();
      assert.typeOf(info.customData.token.parameters, 'array');
      assert.lengthOf(info.customData.token.parameters, 1);
    });
  });
});
