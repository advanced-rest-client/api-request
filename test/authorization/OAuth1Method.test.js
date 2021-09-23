import { fixture, assert, aTimeout, nextFrame, html } from "@open-wc/testing";
import { defaultSignatureMethods } from "@advanced-rest-client/authorization/src/Oauth1MethodMixin.js";
import "../../amf-authorization-method.js";
import { TestHelper } from "../TestHelper.js";

/** @typedef {import('@api-client/amf-store/worker.index').AmfStoreService} AmfStoreService */
/** @typedef {import('@api-client/amf-store/worker.index').ApiParametrizedSecuritySchemeRecursive} ApiParametrizedSecuritySchemeRecursive */
/** @typedef {import('@anypoint-web-components/anypoint-input').AnypointInput} AnypointInput */
/** @typedef {import('../../').AmfAuthorizationMethodElement} AmfAuthorizationMethodElement */

describe("OAuth 1", () => {
  /**
   * @param {ApiParametrizedSecuritySchemeRecursive=} security
   * @return {Promise<AmfAuthorizationMethodElement>}
   */
  async function methodFixture(security) {
    return fixture(html`<amf-authorization-method
      type="oauth 1"
      .security="${security}"
    ></amf-authorization-method>`);
  }

  /** @type AmfStoreService */
  let store;
  before(async () => {
    store = await TestHelper.getModelStore("secured-api", "RAML 1.0");
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
      element.type = 'oauth 1';
      assert.ok(element);
    });

    it('can be initialized in a template with model', async () => {
      const operation = await store.getOperationRecursive('get', '/oauth1');
      const element = await methodFixture(operation.security[0]);
      await aTimeout(0);
      assert.ok(element);
    });
  });

  describe("setting API data", () => {
    it("sets requestTokenUri", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(scheme);
      assert.equal(
        element.requestTokenUri,
        "http://api.domain.com/oauth1/request_token"
      );
    });

    it("sets authorizationUri", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(scheme);
      assert.equal(
        element.authorizationUri,
        "http://api.domain.com/oauth1/authorize"
      );
    });

    it("sets accessTokenUri", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(scheme);
      assert.equal(
        element.accessTokenUri,
        "http://api.domain.com/oauth1/access_token"
      );
    });

    it("sets all supported signatureMethods", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(scheme);
      assert.deepEqual(element.signatureMethods, ["RSA-SHA1", "HMAC-SHA1"]);
    });

    it("sets api defined signature methods", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1-signature', 'get');
      const element = await methodFixture(scheme);
      assert.deepEqual(element.signatureMethods, ["RSA-SHA1"]);
    });

    it("re-sets signature methods when changing scheme", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1-signature', 'get');
      const element = await methodFixture(scheme);
      await nextFrame();
      const operation = await store.getOperationRecursive('get', '/basic');
      const schema2 = operation.security[0].schemes[0];
      element.security = schema2;
      await nextFrame();
      assert.deepEqual(element.signatureMethods, defaultSignatureMethods);
    });

    it("re-sets signature when no signatures defined", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1', 'get');
      const element = await methodFixture(scheme);
      await nextFrame();
      const operation = await store.getOperationRecursive('get', '/oauth1-nosignature');
      const schema2 = operation.security[0].schemes[0];
      element.security = schema2;
      await nextFrame();
      assert.deepEqual(element.signatureMethods, defaultSignatureMethods);
    });

    it("ignores when no settings in the API model", async () => {
      const scheme = await getApiParametrizedSecurityScheme('/oauth1-nosettings', 'get');
      await methodFixture(scheme);
    });
  });
});
