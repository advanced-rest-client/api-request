import { fixture, assert, aTimeout, nextFrame, html } from "@open-wc/testing";
import { defaultSignatureMethods } from '@advanced-rest-client/authorization/src/lib/ui/OAuth1.js';
import { AmfLoader } from "../AmfLoader.js";
import '../../api-authorization-method.js';

/** @typedef {import('../../').ApiAuthorizationMethodElement} ApiAuthorizationMethodElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('@anypoint-web-components/anypoint-input').AnypointInput} AnypointInput */

describe("OAuth 1", () => {
  /**
   * @param {AmfDocument} model
   * @param {ApiParametrizedSecurityScheme=} security
   * @return {Promise<ApiAuthorizationMethodElement>}
   */
  async function methodFixture(model, security) {
    return fixture(html`<api-authorization-method
      type="oauth 1"
      .amf="${model}"
      .security="${security}"
    ></api-authorization-method>`);
  }

  /** @type AmfLoader */
  let store;
  /** @type AmfDocument */
  let model;
  before(async () => {
    store = new AmfLoader();
    model = await store.getGraph(false, 'secured-api');
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

  describe('initialization', () => {
    it('can be initialized with document.createElement', () => {
      const element = document.createElement('api-authorization-method');
      element.type = 'oauth 1';
      assert.ok(element);
    });

    it('can be initialized in a template with model', async () => {
      const operation = store.getOperation(model, '/oauth1', 'get');
      const element = await methodFixture(model, operation.security[0]);
      await aTimeout(0);
      assert.ok(element);
    });
  });

  describe("setting API data", () => {
    it("sets requestTokenUri", async () => {
      const scheme = getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(model, scheme);
      assert.equal(
        element.requestTokenUri,
        "http://api.domain.com/oauth1/request_token"
      );
    });

    it("sets authorizationUri", async () => {
      const scheme = getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(model, scheme);
      assert.equal(
        element.authorizationUri,
        "http://api.domain.com/oauth1/authorize"
      );
    });

    it("sets accessTokenUri", async () => {
      const scheme = getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(model, scheme);
      assert.equal(
        element.accessTokenUri,
        "http://api.domain.com/oauth1/access_token"
      );
    });

    it("sets all supported signatureMethods", async () => {
      const scheme = getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(model, scheme);
      assert.deepEqual(element.signatureMethods, ["RSA-SHA1", "HMAC-SHA1"]);
    });

    it("sets api defined signature methods", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1-signature', 'get');
      const element = await methodFixture(model, scheme);
      assert.deepEqual(element.signatureMethods, ["RSA-SHA1"]);
    });

    it("re-sets signature methods when changing scheme", async () => {
      const scheme = getApiParametrizedSecurityScheme('/oauth1-signature', 'get');
      const element = await methodFixture(model, scheme);
      await nextFrame();
      const schema2 = getApiParametrizedSecurityScheme('/basic', 'get');
      element.security = schema2;
      await nextFrame();
      assert.deepEqual(element.signatureMethods, defaultSignatureMethods);
    });

    it("re-sets signature when no signatures defined", async () => {
      const scheme = getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(model, scheme);
      await nextFrame();
      const operation = store.getOperation(model, '/oauth1-nosignature', 'get');
      const schema2 = operation.security[0].schemes[0];
      element.security = schema2;
      await nextFrame();
      assert.deepEqual(element.signatureMethods, defaultSignatureMethods);
    });

    it("ignores when no settings in the API model", async () => {
      const scheme = getApiParametrizedSecurityScheme('/oauth1-nosettings', 'get');
      await methodFixture(model, scheme);
    });
  });
});
