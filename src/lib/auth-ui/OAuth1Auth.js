/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import { ns } from '@api-components/amf-helper-mixin';
import Oauth1, { defaultSignatureMethods } from '@advanced-rest-client/authorization/src/lib/ui/OAuth1.js';

const securityValue = Symbol("securityValue");
const apiValue = Symbol("apiValue");

/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityOAuth1Settings} ApiSecurityOAuth1Settings */
/** @typedef {import('@api-components/amf-helper-mixin').DomainElement} DomainElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */

export default class OAuth1Auth extends Oauth1 {
  /**
   * @returns {ApiParametrizedSecurityScheme}
   */
  get security() {
    return this[securityValue];
  }

  /**
   * @param {ApiParametrizedSecurityScheme} value
   */
  set security(value) {
    const old = this[securityValue];
    if (old === value) {
      return;
    }
    this[securityValue] = value;
    this.initializeApiModel();
  }

  /**
   * @returns {DomainElement}
   */
  get amf() {
    return this[apiValue];
  }

  /**
   * @param {DomainElement} value
   */
  set amf(value) {
    const old = this[apiValue];
    if (old === value) {
      return;
    }
    this[apiValue] = value;
    this.initializeApiModel();
  }

  reset() {
    this.signatureMethods = defaultSignatureMethods;
    // @ts-ignore
    this.requestUpdate();
    // @ts-ignore
    this.notifyChange();
  }

  initializeApiModel() {
    const { amf, security } = this;
    if (!amf || !security) {
      this.reset();
      return;
    }
    if (!security.types.includes(ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
      this.reset();
      return;
    }
    const { scheme } = security;
    if (!scheme) {
      this.reset();
      return;
    }
    const { type } = scheme;
    if (!type || type !== 'OAuth 1.0') {
      this.reset();
      return;
    }
    const config = /** @type ApiSecurityOAuth1Settings */ (scheme.settings);
    if (!config) {
      this.reset();
      return;
    }
    
    this.requestTokenUri = config.requestTokenUri;
    this.authorizationUri = config.authorizationUri;
    this.accessTokenUri = config.tokenCredentialsUri;
    const { signatures } = config;
    if (!signatures || !signatures.length) {
      this.reset();
    } else {
      this.signatureMethods = signatures;
    }
    // @ts-ignore
    this.requestUpdate();
    // @ts-ignore
    this.notifyChange();
  }
}
