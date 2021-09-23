/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
import AuthUiBase from "@advanced-rest-client/authorization/src/lib/ui/AuthUiBase.js";
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import { AmfParameterMixin } from '../AmfParameterMixin.js';

/** @typedef {import('@advanced-rest-client/authorization').AuthUiInit} AuthUiInit */
/** @typedef {import('@api-components/amf-helper-mixin').DomainElement} DomainElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */

const securityValue = Symbol("securityValue");
const apiValue = Symbol("apiValue");

export default class ApiUiBase extends AmfParameterMixin(AuthUiBase) {
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

  // /**
  //  * @param {AuthUiInit=} init
  //  */
  // constructor(init) {
  //   super(init);
  // }

  /**
   * To be implemented by the child classes.
   * Called when `amf` or `security` value change. Should be used
   * to initialize the UI after setting AMF models.
   */
  initializeApiModel() {
    // ...
  }

  /**
   * Updates, if applicable, query parameter value.
   *
   * This does nothing if the query parameter has not been defined for the current
   * scheme.
   *
   * @param {string} name The name of the changed parameter
   * @param {string} newValue A value to apply. May be empty but must be defined.
   */
  updateQueryParameter(name, newValue) {
    // ...
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
    // ...
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
    // ...
  }

  /**
   * To be implemented by the child classes.
   * @returns {boolean} True when the UI is in valid state.
   */
  validate() {
    return true;
  }
}
