import { AuthorizationMethodElement as AuthorizationMethod } from "@advanced-rest-client/authorization";
import {
  normalizeType,
  METHOD_OAUTH2,
  METHOD_OAUTH1,
  METHOD_BASIC,
  METHOD_BEARER,
  METHOD_NTLM,
  METHOD_DIGEST,
  METHOD_OIDC,
} from "@advanced-rest-client/authorization/src/Utils.js";
import {
  typeChangedSymbol,
  renderCallback,
  changeCallback,
  factory,
  propagateChanges,
} from "@advanced-rest-client/authorization/src/AuthorizationMethodElement.js";
import { ApiAuthDataHelper } from "../lib/ApiAuthDataHelper.js";
import * as InputCache from "../lib/InputCache.js";
import styles from '../styles/AuthorizationMethod.js';
import { EventTypes } from '../events/EventTypes.js';

export const METHOD_CUSTOM = "custom";
export const METHOD_PASS_THROUGH = "pass through";
export const METHOD_API_KEY = "api key";
export const initApiFactory = Symbol("initApiFactory");
export const apiValue = Symbol("apiValue");
export const settingsHandler = Symbol("settingsHandler");

/** @typedef {import('lit-element').CSSResult} CSSResult */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BasicAuthorization} BasicAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth1Authorization} OAuth1Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.DigestAuthorization} DigestAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BearerAuthorization} BearerAuthorization */
/** @typedef {import('@advanced-rest-client/authorization').AuthUiInit} AuthUiInit */
/** @typedef {import('@advanced-rest-client/authorization').AuthUiBase} AuthUiBase */
/** @typedef {import('@api-components/amf-helper-mixin').DomainElement} DomainElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */
/** @typedef {import('../lib/auth-ui/CustomAuth').default} CustomAuth */
/** @typedef {import('../lib/auth-ui/ApiKeyAuth').default} ApiKeyAuth */
/** @typedef {import('../lib/auth-ui/ApiUiBase').default} ApiUiBase */
/** @typedef {import('../lib/auth-ui/PassThroughAuth').default} PassThroughAuth */

export default class ApiAuthorizationMethodElement extends AuthorizationMethod {
  /**
   * @returns {CSSResult}
   */
  get styles() {
    // @ts-ignore
    return [
      super.styles,
      styles,
    ];
  }

  static get properties() {
    return {
      /**
       * The full AMF graph model of the API.
       */
      amf: { type: Object },
      /**
       * A security model generated by the AMF parser.
       */
      security: { type: Object },
      /**
       * When set the "description" of the security definition is rendered.
       */
      descriptionOpened: { type: Boolean },
      /**
       * By default the element stores user input in a map that is associated with the specific
       * instance of this element. This way the element can be used multiple times in the same document.
       * However, this way parameter values generated by the generators or entered by the user won't
       * get populated in different operations.
       *
       * By setting this value the element prefers a global cache for values. Once the user enter
       * a value it is registered in the global cache and restored when the same parameter is used again.
       *
       * Do not use this option when the element is embedded multiple times in the page. It will result
       * in generating request data from the cache and not what's in the form inputs and these may not be in sync.
       *
       * These values are stored in memory only. Listen to the `change` event to learn that something changed.
       */
      globalCache: { type: Boolean, reflect: true },
      /**
       * Used by the OAuth 2 type.
       * When set it overrides the `authorizationUri` in the authorization editor,
       * regardless to the authorization scheme applied to the request.
       * This is to be used with the mocking service.
       */
      overrideAuthorizationUri: { type: String },
      /**
       * Used by the OAuth 2 type.
       * When set it overrides the `authorizationUri` in the authorization editor,
       * regardless to the authorization scheme applied to the request.
       * This is to be used with the mocking service.
       */
      overrideAccessTokenUri: { type: String },
    };
  }

  constructor() {
    super();
    /** @type {DomainElement} */
    this.amf = undefined;
    /** @type {ApiParametrizedSecurityScheme} */
    this.security = undefined;
    /** @type {boolean} */
    this.compatibility = undefined;
    /** @type {boolean} */
    this.descriptionOpened = undefined;
    /** @type {boolean} */
    this.globalCache = undefined;
    /** @type {string} */
    this.schemeName = undefined;
    /** @type {string} */
    this.schemeDescription = undefined;
    /** @type {string} */
    this.overrideAuthorizationUri = undefined;
    /** @type {string} */
    this.overrideAccessTokenUri = undefined;
    this[settingsHandler] = this[settingsHandler].bind(this);
  }

  connectedCallback() {
    InputCache.registerLocal(this);
    this.addEventListener(EventTypes.Security.settingsChanged, this[settingsHandler]);
    super.connectedCallback();
  }

  disconnectedCallback() {
    this.removeEventListener(EventTypes.Security.settingsChanged, this[settingsHandler]);
    super.disconnectedCallback();
  }

  /**
   * Validates current method.
   * @return {boolean}
   */
  validate() {
    const instance = /** @type ApiUiBase */ (this[factory]);
    const type = normalizeType(this.type);
    switch(type) {
      case METHOD_CUSTOM: 
      case METHOD_PASS_THROUGH:
      case METHOD_API_KEY: return instance.validate();
      default: return super.validate();
    }
  }

  /**
   * A handler for the global authorization settings change event.
   * It applies the the event settings to the current configuration.
   * @param {CustomEvent} e
   */
  [settingsHandler](e) {
    const { detail } = e;
    const serialized = this.serialize();
    this.restore({ ...serialized, ...detail });
  }

  /**
   * A function called when `type` changed.
   * Note, that other properties may not be initialized just yet.
   *
   * @param {string} type Current value.
   */
  [typeChangedSymbol](type) {
    const init = /** @type AuthUiInit */ ({
      renderCallback: this[renderCallback],
      changeCallback: this[changeCallback],
      target: this,
      readOnly: this.readOnly,
      disabled: this.disabled,
      anypoint: this.compatibility,
      outlined: this.outlined,
      authorizing: this.authorizing,
    });
    /** @type AuthUiBase */
    let instance;
    const normalized = normalizeType(type);
    switch (normalized) {
      case METHOD_BASIC:
        instance = ApiAuthDataHelper.setupBasic(this, init);
        break;
      case METHOD_BEARER:
        instance = ApiAuthDataHelper.setupBearer(this, init);
        break;
      case METHOD_NTLM:
        instance = ApiAuthDataHelper.setupNtlm(this, init);
        break;
      case METHOD_DIGEST:
        instance = ApiAuthDataHelper.setupDigest(this, init);
        break;
      case METHOD_OIDC:
        instance = ApiAuthDataHelper.setupOidc(this, init);
        break;
      case METHOD_CUSTOM:
        instance = ApiAuthDataHelper.setupCustom(this, init);
        break;
      case METHOD_OAUTH2:
        instance = ApiAuthDataHelper.setupOauth2(this, init);
        break;
      case METHOD_OAUTH1:
        instance = ApiAuthDataHelper.setupOauth1(this, init);
        break;
      case METHOD_PASS_THROUGH:
        instance = ApiAuthDataHelper.setupPassThrough(this, init);
        break;
      case METHOD_API_KEY:
        instance = ApiAuthDataHelper.setupApiKey(this, init);
        break;
      default:
        throw new Error(`Unsupported authorization type ${type}`);
    }
    this[factory] = instance;
    instance.defaults();
    this.requestUpdate();
  }

  /**
   * Propagates values from the UI factory to this element.
   * This is to synchronize user entered values with the element's state.
   */
  [propagateChanges]() {
    switch (normalizeType(this.type)) {
      case METHOD_CUSTOM:
        ApiAuthDataHelper.populateCustom(
          this,
          /** @type CustomAuth */ (this[factory])
        );
        break;
      case METHOD_PASS_THROUGH:
        ApiAuthDataHelper.populatePassThrough(
          this,
          /** @type PassThroughAuth */ (this[factory])
        );
        break;
      case METHOD_API_KEY:
        ApiAuthDataHelper.populateApiKey(
          this,
          /** @type ApiKeyAuth */ (this[factory])
        );
        break;
      default:
        super[propagateChanges]();
    }
  }

  /**
   * Updates, if applicable, query parameter value.
   * This is supported for RAML custom scheme and Pass Through
   * that operates on query parameters model which is only an internal
   * model.
   *
   * This does nothing if the query parameter has not been defined for current
   * scheme.
   *
   * @param {string} name The name of the changed parameter
   * @param {string} newValue A value to apply. May be empty but must be defined.
   */
  updateQueryParameter(name, newValue) {
    const instance = /** @type ApiUiBase */ (this[factory]);
    if (!instance) {
      // eslint-disable-next-line no-console
      console.warn(`Setting a query parameter before "type" was set.`);
      return;
    }
    let setValue = newValue;
    if (setValue === null || setValue === undefined) {
      setValue = '';
    }
    if (typeof instance.updateQueryParameter === 'function') {
      instance.updateQueryParameter(name, setValue);
    }
  }

  /**
   * Updates, if applicable, header value.
   * This is supported for RAML custom scheme and Pass Through
   * that operates on headers model which is only an internal model.
   *
   * This does nothing if the header has not been defined for current
   * scheme.
   *
   * @param {string} name The name of the changed header
   * @param {string} newValue A value to apply. May be empty but must be defined.
   */
  updateHeader(name, newValue) {
    const instance = /** @type ApiUiBase */ (this[factory]);
    if (!instance) {
      // eslint-disable-next-line no-console
      console.warn(`Setting a query parameter before "type" was set.`);
      return;
    }
    let setValue = newValue;
    if (setValue === null || setValue === undefined) {
      setValue = '';
    }
    if (typeof instance.updateHeader === 'function') {
      instance.updateHeader(name, setValue);
    }
  }

  /**
   * Updates, if applicable, cookie value.
   * This is supported in OAS' Api Key.
   *
   * This does nothing if the cookie has not been defined for current
   * scheme.
   *
   * @param {string} name The name of the changed cookie
   * @param {string} newValue A value to apply. May be empty but must be defined.
   */
  updateCookie(name, newValue) {
    const instance = /** @type ApiUiBase */ (this[factory]);
    if (!instance) {
      // eslint-disable-next-line no-console
      console.warn(`Setting a query parameter before "type" was set.`);
      return;
    }
    let setValue = newValue;
    if (setValue === null || setValue === undefined) {
      setValue = '';
    }
    if (typeof instance.updateCookie === 'function') {
      instance.updateCookie(name, setValue);
    }
  }
}