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
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityRequirement} ApiSecurityRequirement */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.ApiKeyAuthorization} ApiKeyAuthorization */

describe('ApiAuthorizationEditorElement OAS tests', () => {
  /**
   * @param {AmfDocument} model
   * @param {ApiSecurityRequirement} security
   * @returns {Promise<ApiAuthorizationEditorElement>} 
   */
  async function basicFixture(model, security) {
    const element = /** @type ApiAuthorizationEditorElement */ (await fixture(html`<api-authorization-editor
      .amf="${model}"
      .security="${security}"
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

  describe('Single vs multiple', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(false, 'secured-unions');
    });

    describe(`Single method`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;
      
      beforeEach(async () => {
        const security = getSecurityRequirement(model, '/single', 'get');
        element = await basicFixture(model, security);
      });

      it('has a single method definition', () => {
        const methods = element[methodsValue];
        assert.lengthOf(methods.types, 1);
      });

      it('renders a single method', () => {
        const nodes = element.shadowRoot.querySelectorAll('api-authorization-method');
        assert.lengthOf(nodes, 1);
      });
    });

    describe(`Multiple methods`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;

      beforeEach(async () => {
        const security = await getSecurityRequirement(model, '/and-and-or-union', 'get');
        element = await basicFixture(model, security);
      });

      it('has all methods definitions', () => {
        const methods = element[methodsValue];
        assert.lengthOf(methods.types, 2);
      });

      it('renders editors for each method', () => {
        const nodes = element.shadowRoot.querySelectorAll('api-authorization-method');
        assert.lengthOf(nodes, 2);
      });
    });
  });

  describe('Api Key method', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(false, 'api-keys');
    });

    describe(`Basic tests`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;
      
      beforeEach(async () => {
        const security = await getSecurityRequirement(model, '/query', 'get');
        element = await basicFixture(model, security);
      });

      it('has "types" in the authorization object', () => {
        const methods = element[methodsValue];
        const { types } = methods;
        assert.deepEqual(types, ['Api Key']);
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
        form.updateQueryParameter('client_id', 'test')
        form.dispatchEvent(new CustomEvent('change'));
        assert.isTrue(spy.called);
      });

      // it.only('element is not invalid without required values', () => {
      //   const result = element.validate();
      //   assert.isFalse(result, 'validation result is false');
      //   console.log(element.serialize()[0].config);
      //   assert.isNotTrue(element.invalid, 'is not invalid');
      // });

      it('element is valid with required values', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.updateQueryParameter('client_id', 'test');
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.validate();
        assert.isTrue(result, 'validation result is true');
        assert.isFalse(element.invalid, 'is not invalid');
      });

      it('serializes the settings', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.updateQueryParameter('client_id', 'test');
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const auth = element.serialize();
        const [result] = auth;
        assert.equal(result.type, 'api key', 'auth has type');
        assert.equal(result.valid, true, 'auth is valid');
        assert.equal(result.enabled, true, 'auth is enabled');
        assert.typeOf(result.config, 'object', 'has auth config');
        const cnf = /** @type ApiKeyAuthorization */ (result.config);
        assert.equal(cnf.query.client_id, 'test', 'has config.query.client_id');
      });
    });
  });

  // due to an issue with AMF the http methods don't work when importing a graph model.
  describe.skip('Bearer method', () => {
    /** @type AmfDocument */
    let model;
    before(async () => {
      model = await store.getGraph(false, 'oas-bearer');
    });

    describe(`Basic tests`, () => {
      /** @type ApiAuthorizationEditorElement */
      let element;
      
      beforeEach(async () => {
        const security = await getSecurityRequirement(model, '/bearer', 'get');
        element = await basicFixture(model, security);
      });

      it('has "types" in the authorization object', () => {
        const methods = element[methodsValue];
        const { types } = methods;
        assert.deepEqual(types, ['bearer']);
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
        form.token = 'test';
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
        form.token = 'test';
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const result = element.validate();
        assert.isTrue(result, 'validation result is true');
        assert.isFalse(element.invalid, 'is not invalid');
      });

      it('creates params with serialize()', async () => {
        const form = element.shadowRoot.querySelector('api-authorization-method');
        form.token = 'test';
        form.dispatchEvent(new CustomEvent('change'));
        await nextFrame();
        const [result] = element.serialize();
        const cnf = /** @type ApiKeyAuthorization */ (result.config)
        assert.deepEqual(cnf.header, {
          authorization: 'Bearer test',
        }, 'has headers');
        assert.deepEqual(cnf.query, {}, 'has no params');
        assert.deepEqual(cnf.cookie, {}, 'has no cookies');
      });
    });
  });
});
