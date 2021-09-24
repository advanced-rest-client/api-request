import { html, fixture, assert, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import { AmfLoader } from "../AmfLoader.js";
import '../../api-authorization-editor.js';
import { methodsValue } from '../../src/elements/ApiAuthorizationEditorElement.js';

/** @typedef {import('../../index').ApiAuthorizationEditorElement} ApiAuthorizationEditorElement */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BasicAuthorization} BasicAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth1Authorization} OAuth1Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.DigestAuthorization} DigestAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BearerAuthorization} BearerAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.PassThroughAuthorization} PassThroughAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.RamlCustomAuthorization} RamlCustomAuthorization */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityRequirement} ApiSecurityRequirement */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.ApiKeyAuthorization} ApiKeyAuthorization */

describe('ApiAuthorizationEditorElement', () => {
  /**
   * @param {AmfDocument} model
   * @param {ApiSecurityRequirement} security
   * @returns {Promise<ApiAuthorizationEditorElement>} 
   */
  async function basicFixture(model, security) {
    const element = /** @type ApiAuthorizationEditorElement */ (await fixture(html`<api-authorization-editor
      .amf="${model}"
      .security="${security}"
      oauth2RedirectUri="https://api.rdr.com"
    ></api-authorization-editor>`));
    return element;
  }

  /** @type AmfLoader */
  let store;
  before(async () => {
    store = new AmfLoader();
  });

  /**
   * @param {AmfDocument} model
   * @param {string} path
   * @param {string} method
   * @returns {ApiSecurityRequirement} 
   */
  function getSecurityRequirement(model, path, method) {
    const operation = store.getOperation(model, path, method);
    return operation.security[0];
  }

  describe('RAML tests', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(false, 'secured-api');
    });

    describe(`Basic method`, () => {
      const username = 'uname';
      /** @type ApiAuthorizationEditorElement */
      let element;

      beforeEach(async () => {
        const security = getSecurityRequirement(model, '/basic', 'get');
        element = await basicFixture(model, security);
      });

      it('has "types" in the authorization object', () => {
        const methods = element[methodsValue];
        const { types } = methods;
        assert.deepEqual(types, ['Basic Authentication']);
      });

      it('has "schemes" in the authorization object', () => {
        const methods = element[methodsValue];
        const { schemes } = methods;
        assert.typeOf(schemes[0], 'object');
      });

      it('notifies changes when panel value change', () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        const spy = sinon.spy();
        element.addEventListener('change', spy);
        form.username = username;
        form.dispatchEvent(new CustomEvent('change'));
        assert.isTrue(spy.called);
      });

      it('element is not invalid before calling validation method', () => {
        assert.isUndefined(element.invalid);
      });

      it('element is invalid without username', () => {
        const result = element.validate();
        assert.isFalse(result, 'validation result is false');
        assert.isTrue(element.invalid, 'is invalid');
      });

      it('element is valid with username', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.username = username;
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.validate();
        assert.isTrue(result, 'validation result is true');
        assert.isFalse(element.invalid, 'is not invalid');
      });

      it('creates params with serialize()', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.username = username;
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.serialize();
        const cnf = /** @type BasicAuthorization */ (result[0].config);
        assert.equal(cnf.username, username, 'has username');
        assert.equal(cnf.password, '', 'has no password');
      });
    });

    describe(`Digest method`, () => {
      const username = 'uname';
      /** @type ApiAuthorizationEditorElement */
      let element;

      beforeEach(async () => {
        const security = getSecurityRequirement(model, '/digest', 'get');
        element = await basicFixture(model, security);
      });

      it('has "types" in the authorization object', () => {
        const methods = element[methodsValue];
        const { types } = methods;
        assert.deepEqual(types, ['Digest Authentication']);
      });

      it('has "schemes" in the authorization object', () => {
        const methods = element[methodsValue];
        const { schemes } = methods;
        assert.typeOf(schemes[0], 'object');
      });

      it('notifies changes when panel value change', () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        const spy = sinon.spy();
        element.addEventListener('change', spy);
        form.username = username;
        form.dispatchEvent(new CustomEvent('change'));
        assert.isTrue(spy.called);
      });

      it('element is not invalid before calling validation method', () => {
        assert.isUndefined(element.invalid);
      });

      it('element is invalid without required values', () => {
        const result = element.validate();
        assert.isFalse(result, 'validation result is false');
        assert.isTrue(element.invalid, 'is invalid');
      });

      it('element is valid with required values', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.username = username;
        form.realm = 'realm';
        form.nonce = 'nonce';
        form.qop = 'auth';
        form.opaque = 'opaque';
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.validate();
        assert.isTrue(result, 'validation result is true');
        assert.isFalse(element.invalid, 'is not invalid');
      });

      it('produces authorization settings', async () => {
        element.httpMethod = 'GET';
        element.requestUrl = 'https://api.domain.com/endpoint';
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.username = username;
        form.realm = 'realm';
        form.nonce = 'nonce';
        form.qop = 'auth';
        form.opaque = 'opaque';
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.serialize();
        const [auth] = result;
        const settings = /** @type DigestAuthorization */ (auth.config);

        assert.isTrue(auth.valid, 'valid is true');
        assert.isTrue(auth.enabled, 'enabled is true');
        assert.equal(auth.type, 'digest', 'type is set');
        assert.typeOf(settings, 'object');
        assert.equal(settings.algorithm, 'MD5', 'algorithm is set');
        assert.equal(settings.nc, '00000001', 'nc is set');
        assert.typeOf(settings.cnonce, 'string', 'cnonce is set');
        assert.typeOf(settings.response, 'string', 'response is set');
        assert.equal(settings.nonce, 'nonce', 'nonce is set');
        assert.equal(settings.opaque, 'opaque', 'opaque is set');
        assert.equal(settings.password, '', 'password is set');
        assert.equal(settings.qop, 'auth', 'qop is set');
        assert.equal(settings.realm, 'realm', 'realm is set');
        assert.equal(settings.username, username, 'username is set');
        assert.equal(settings.uri, '/endpoint', 'uri is set');
      });
    });

    describe(`Pass through method`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;

      beforeEach(async () => {
        const security = getSecurityRequirement(model, '/passthrough', 'get');
        element = await basicFixture(model, security);
      });

      it('has "types" in the authorization object', () => {
        const methods = element[methodsValue];
        const { types } = methods;
        assert.deepEqual(types, ['Pass Through']);
      });

      it('has "schemes" in the authorization object', () => {
        const methods = element[methodsValue];
        const { schemes } = methods;
        assert.typeOf(schemes[0], 'object');
      });

      it('notifies changes when panel value change', () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        const spy = sinon.spy();
        element.addEventListener('change', spy);
        form.updateHeader('api_key', 'test');
        form.dispatchEvent(new CustomEvent('change'));
        assert.isTrue(spy.called);
      });

      it('element is invalid without required values', () => {
        const result = element.validate();
        assert.isFalse(result, 'validation result is false');
        assert.isTrue(element.invalid, 'is invalid');
      });

      it('element is valid with required values', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.updateHeader('api_key', 'test');
        form.updateQueryParameter('query', 'value');
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.validate();
        assert.isTrue(result, 'validation result is true');
        assert.isFalse(element.invalid, 'is not invalid');
      });

      it('produces authorization settings', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.updateHeader('api_key', 'test');
        form.updateQueryParameter('query', 'value');
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.serialize();
        const [auth] = result;
        const settings = /** @type PassThroughAuthorization */ (auth.config);

        assert.isTrue(auth.valid, 'valid is true');
        assert.isTrue(auth.enabled, 'enabled is true');
        assert.equal(auth.type, 'pass through', 'type is set');
        assert.typeOf(settings, 'object');
        
        assert.typeOf(settings.header, 'object', 'headers is set');
        assert.typeOf(settings.query, 'object', 'queryParameters is set');
      });
    });

    describe(`RAML Custom method`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;

      beforeEach(async () => {
        const security = getSecurityRequirement(model, '/custom1', 'get');
        element = await basicFixture(model, security);
      });

      it('has "types" in the authorization object', () => {
        const methods = element[methodsValue];
        const { types } = methods;
        assert.deepEqual(types, ['x-my-custom']);
      });

      it('has "schemes" in the authorization object', () => {
        const methods = element[methodsValue];
        const { schemes } = methods;
        assert.typeOf(schemes[0], 'object');
      });

      it('notifies changes when panel value change', () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        const spy = sinon.spy();
        element.addEventListener('change', spy);
        form.updateHeader('SpecialTokenHeader', 'test');
        form.dispatchEvent(new CustomEvent('change'));
        assert.isTrue(spy.called);
      });

      // it('element is not invalid without required values', () => {
      //   const result = element.validate();
      //   assert.isTrue(result, 'validation result is true');
      //   assert.isNotTrue(element.invalid, 'is not invalid');
      // });

      it('element is valid with required values', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.updateHeader('SpecialTokenHeader', 'test');
        form.updateQueryParameter('debugTokenParam', 'Log');
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.validate();
        assert.isTrue(result, 'validation result is true');
        assert.isFalse(element.invalid, 'is not invalid');
      });

      it('produces authorization settings', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.updateHeader('SpecialTokenHeader', 'test');
        form.updateQueryParameter('debugTokenParam', 'Log');
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.serialize();
        const [auth] = result;
        const settings = /** @type RamlCustomAuthorization */ (auth.config);
        
        assert.isTrue(auth.valid, 'valid is true');
        assert.isTrue(auth.enabled, 'enabled is true');
        assert.equal(auth.type, 'custom', 'type is set');
        assert.typeOf(settings, 'object');
        assert.typeOf(settings.header, 'object', 'headers is set');
        assert.typeOf(settings.query, 'object', 'queryParameters is set');
      });
    });

    describe(`Oauth 2 method`, () => {
      describe('Basics', () => {
        /** @type ApiAuthorizationEditorElement */
        let element;

        beforeEach(async () => {
          const security = getSecurityRequirement(model, '/oauth2', 'post');
          element = await basicFixture(model, security);
        });

        it('has "types" in the authorization object', () => {
          const methods = element[methodsValue];
          const { types } = methods;
          assert.deepEqual(types, ['OAuth 2.0']);
        });

        it('has "schemes" in the authorization object', () => {
          const methods = element[methodsValue];
          const { schemes } = methods;
          assert.typeOf(schemes[0], 'object');
        });

        it('notifies changes when panel value change', () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          const spy = sinon.spy();
          element.addEventListener('change', spy);
          form.clientId = 'test';
          form.dispatchEvent(new CustomEvent('change'));
          assert.isTrue(spy.called);
        });

        it('element is invalid without required values', () => {
          const result = element.validate();
          assert.isFalse(result, 'validation result is false');
          assert.isTrue(element.invalid, 'is invalid');
        });

        it('element is valid with required values', async () => {
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.clientId = 'test-client-id';
          form.accessToken = 'test-token';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.validate();
          assert.isTrue(result, 'validation result is true');
          assert.isFalse(element.invalid, 'is not invalid');
        });

        it('produces authorization settings', async () => {
          element.oauth2RedirectUri = 'https://rdr.com';
          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.clientId = 'test-client-id';
          form.accessToken = 'test-token';
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.serialize();
          const [auth] = result;
          const settings = /** @type OAuth2Authorization */ (auth.config);

          assert.isTrue(auth.valid, 'valid is true');
          assert.isTrue(auth.enabled, 'enabled is true');
          assert.equal(auth.type, 'oauth 2', 'type is set');
          assert.typeOf(settings, 'object');

          assert.equal(settings.grantType, 'implicit', 'grantType is set');
          assert.equal(settings.clientId, 'test-client-id', 'clientId is set');
          assert.equal(settings.accessToken, 'test-token', 'accessToken is set');
          assert.equal(settings.tokenType, 'Bearer', 'tokenType is set');
          assert.deepEqual(settings.scopes, ['profile', 'email'], 'scopes is set');
          assert.equal(settings.deliveryMethod, 'header', 'deliveryMethod is set');
          assert.equal(settings.deliveryName, 'Authorization', 'deliveryName is set');
          assert.equal(settings.authorizationUri, 'https://auth.com', 'authorizationUri is set');
          assert.equal(settings.redirectUri, element.oauth2RedirectUri, 'redirectUri is set');
        });
      });

      describe('serialize()', () => {
        const accessToken = 'test-token';
        const clientId = 'test-client-id';

        it('creates params', async () => {
          const security = getSecurityRequirement(model, '/oauth2', 'post');
          const element = await basicFixture(model, security);

          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.clientId = clientId;
          form.accessToken = accessToken;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.serialize();
          const [auth] = result;
          const settings = /** @type OAuth2Authorization */ (auth.config);
          assert.equal(settings.accessToken, accessToken, 'has accessToken');
          assert.equal(settings.clientId, clientId, 'has clientId');
          assert.equal(settings.tokenType, 'Bearer', 'has tokenType');
          assert.equal(settings.grantType, 'implicit', 'has grantType');
          assert.deepEqual(settings.scopes, [ 'profile', 'email' ], 'has scopes');
          assert.equal(settings.deliveryMethod, 'header', 'has deliveryMethod');
          assert.equal(settings.deliveryName, 'Authorization', 'has deliveryName');
          assert.equal(settings.authorizationUri, 'https://auth.com', 'has authorizationUri');
          assert.equal(settings.redirectUri, 'https://api.rdr.com', 'has redirectUri');
        });

        it('marks invalid when no token', async () => {
          const security = await getSecurityRequirement(model, '/oauth2', 'post');
          const element = await basicFixture(model, security);

          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.clientId = clientId;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.serialize();
          const [auth] = result;
          const settings = /** @type OAuth2Authorization */ (auth.config);
          assert.isFalse(auth.valid, 'is not valid')
          assert.equal(settings.accessToken, '', 'has no accessToken');
        });

        it('respects delivery method (query)', async () => {
          const security = await getSecurityRequirement(model, '/oauth2-query-delivery', 'get');
          const element = await basicFixture(model, security);

          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.clientId = clientId;
          form.clientSecret = 'test';
          form.accessToken = accessToken;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.serialize();
          const [auth] = result;
          const settings = /** @type OAuth2Authorization */ (auth.config);

          assert.equal(settings.deliveryMethod, 'query', 'has deliveryMethod');
          assert.equal(settings.deliveryName, 'access_token', 'has deliveryName');
        });

        it('respects delivery method (header)', async () => {
          const security = await getSecurityRequirement(model, '/oauth2-header-delivery', 'get');
          const element = await basicFixture(model, security);

          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.clientId = clientId;
          form.clientSecret = 'test';
          form.accessToken = accessToken;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.serialize();
          const [auth] = result;
          const settings = /** @type OAuth2Authorization */ (auth.config);

          assert.equal(settings.deliveryMethod, 'header', 'has deliveryMethod');
          assert.equal(settings.deliveryName, 'token', 'has deliveryName');
        });

        it('uses default delivery', async () => {
          const security = await getSecurityRequirement(model, '/oauth2-no-delivery', 'get');
          const element = await basicFixture(model, security);

          const form = element.shadowRoot.querySelector('api-authorization-method');
          form.clientId = clientId;
          form.clientSecret = 'test';
          form.accessToken = accessToken;
          form.dispatchEvent(new CustomEvent('change'));
          await nextFrame();
          const result = element.serialize();
          const [auth] = result;
          const settings = /** @type OAuth2Authorization */ (auth.config);

          assert.equal(settings.deliveryMethod, 'header', 'has deliveryMethod');
          assert.equal(settings.deliveryName, 'authorization', 'has deliveryName');
        });
      });
    });

    describe(`OAuth 1 method`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;

      beforeEach(async () => {
        const security = getSecurityRequirement(model, '/oauth1', 'get');
        element = await basicFixture(model, security);
      });

      it('has "types" in the authorization object', () => {
        const methods = element[methodsValue];
        const { types } = methods;
        assert.deepEqual(types, ['OAuth 1.0']);
      });

      it('has "schemes" in the authorization object', () => {
        const methods = element[methodsValue];
        const { schemes } = methods;
        assert.typeOf(schemes[0], 'object');
      });

      it('notifies changes when panel value change', () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        const spy = sinon.spy();
        element.addEventListener('change', spy);
        form.consumerKey = 'test';
        form.dispatchEvent(new CustomEvent('change'));
        assert.isTrue(spy.called);
      });

      it('element is invalid without required values', () => {
        const result = element.validate();
        assert.isFalse(result, 'validation result is false');
        assert.isTrue(element.invalid, 'is invalid');
      });

      it('serializes values', async () => {
        const result = element.serialize();
        const [auth] = result;
        const settings = /** @type OAuth1Authorization */ (auth.config);

        assert.isFalse(auth.valid, 'valid is true');
        assert.isTrue(auth.enabled, 'enabled is true');
        assert.equal(auth.type, 'oauth 1', 'type is set');
        assert.equal(settings.signatureMethod, 'HMAC-SHA1', 'has signatureMethod');
        assert.equal(settings.requestTokenUri, 'http://api.domain.com/oauth1/request_token', 'has requestTokenUri');
        assert.equal(settings.accessTokenUri, 'http://api.domain.com/oauth1/access_token', 'has accessTokenUri');
        assert.equal(settings.redirectUri, 'https://api.rdr.com', 'has redirectUri');
        assert.equal(settings.authTokenMethod, 'POST', 'has authTokenMethod');
        assert.equal(settings.authParamsLocation, 'authorization', 'has authParamsLocation');
        assert.equal(settings.authorizationUri, 'http://api.domain.com/oauth1/authorize', 'has authorizationUri');
      });
    });

    describe(`RAML null method`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;

      beforeEach(async () => {
        const security = getSecurityRequirement(model, '/nil-oauth2', 'get');
        element = await basicFixture(model, security);
      });

      it('does not render authorization method', () => {
        const node = element.shadowRoot.querySelector('api-authorization-method');
        assert.notOk(node);
      });
    });
  });
});
