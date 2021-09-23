/* eslint-disable class-methods-use-this */
import { html } from 'lit-html';
import { ns } from '@api-components/amf-helper-mixin';
import ApiUiBase from './ApiUiBase.js';
import * as InputCache from '../InputCache.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityApiKeySettings} ApiSecurityApiKeySettings */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.ApiKeyAuthorization} ApiKeyAuthorization */
/** @typedef {import('../../types').OperationParameter} OperationParameter */

export default class ApiKeyAuth extends ApiUiBase {
  async initializeApiModel() {
    const { amf, security } = this;
    const source = 'settings';
    const list = /** @type OperationParameter[] */ (this.parametersValue);
    this.parametersValue = list.filter(item => item.source !== source);

    if (!amf || !security) {
      return;
    }
    if (!security.types.includes(ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
      return;
    }
    const { scheme } = security;
    if (!scheme) {
      return;
    }
    const { type } = scheme;
    if (!type || !type.startsWith('Api Key')) {
      return;
    }
    const config = /** @type ApiSecurityApiKeySettings */ (scheme.settings);
    if (!config) {
      return;
    }
    const { in: binding, id } = config;
    if (!InputCache.has(this.target, id, this.globalCache)) {
      InputCache.set(this.target, id, '', this.globalCache);
    }
    const params = this.parametersValue;
    params.push({
      binding,
      paramId: id,
      parameter: { ... /** @type any */ (config), binding },
      source: 'settings',
      schemaId: scheme.id,
      schema: /** @type any */ (scheme),
    });
    
    await this.requestUpdate();
    this.notifyChange();
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
    const list = /** @type OperationParameter[] */ (this.parametersValue);
    const param = list.find(i => i.binding === 'query' && i.parameter.name === name);
    if (param) {
      InputCache.set(this.target, param.paramId, newValue, this.globalCache);
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
    const list = /** @type OperationParameter[] */ (this.parametersValue);
    const param = list.find(i => i.binding === 'header' && i.parameter.name === name);
    if (param) {
      InputCache.set(this.target, param.paramId, newValue, this.globalCache);
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
    const list = /** @type OperationParameter[] */ (this.parametersValue);
    const param = list.find(i => i.binding === 'cookie' && i.parameter.name === name);
    if (param) {
      InputCache.set(this.target, param.paramId, newValue, this.globalCache);
    }
  }

  reset() {
    const params = this.parametersValue;
    (params || []).forEach((param) => {
      InputCache.set(this.target, param.paramId, '', this.globalCache)
    });
  }

  /**
   * Restores previously serialized values
   * @param {ApiKeyAuthorization} state
   */
  restore(state) {
    if (!state) {
      return;
    }
    this.restoreModelValue('header', state.header);
    this.restoreModelValue('query', state.query);
    this.restoreModelValue('cookie', state.query);
    this.requestUpdate();
  }

  /**
   * @param {string} binding 
   * @param {ApiKeyAuthorization} restored 
   */
  restoreModelValue(binding, restored) {
    if (!restored) {
      return;
    }
    const list = /** @type OperationParameter[] */ (this.parametersValue);
    const params = list.filter(i => i.binding === binding);
    if (!params) {
      return;
    }
    Object.keys(restored).forEach((name) => {
      const param = params.find(i => i.parameter.name === name);
      if (param) {
        InputCache.set(this.target, param.paramId, restored[name], this.globalCache);
      }
    });
  }

  /**
   * @returns {ApiKeyAuthorization}
   */
  serialize() {
    const params = /** @type OperationParameter[] */ (this.parametersValue);
    const result = /** @type ApiKeyAuthorization */ ({});
    (params || []).forEach((param) => {
      if (!result[param.binding]) {
        result[param.binding] = {};
      }
      let value = InputCache.get(this.target, param.paramId, this.globalCache);
      if (value === '' || value === undefined) {
        if (param.parameter.required === false) {
          return;
        }
        value = '';
      }
      if (value === false && param.parameter.required === false) {
        return;
      }
      if (value === null) {
        value = '';
      }
      result[param.binding][param.parameter.name] = value;
    });
    return /** @type ApiKeyAuthorization */ (result);
  }

  /**
   * @returns {boolean}
   */
  validate() {
    const nils = this.nilValues;
    const params = /** @type OperationParameter[] */ (this.parametersValue);
    return !params.some((param) => {
      if (nils.includes(param.paramId)) {
        return true;
      }
      const value = InputCache.get(this.target, param.paramId, this.globalCache);
      return !value;
    });
  }

  render() {
    return html`
    ${this.titleTemplate()}
    <form autocomplete="on" class="custom-auth">
      ${this.headersTemplate()}
      ${this.queryTemplate()}
      ${this.cookieTemplate()}
    </form>
    `;
  }

  /**
   * Method that renders scheme's title
   *
   * @return {TemplateResult}
   */
  titleTemplate() {
    return html`
    <div class="subtitle">
      <span>Scheme: Api Key</span>
    </div>`;
  }

  /**
   * Method that renders headers, if any
   *
   * @return {TemplateResult|string} Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  headersTemplate() {
    const headers = this.parametersValue.filter(item => item.binding === 'header');
    if (!headers.length) {
      return '';
    }
    return html`
    <section class="params-section">
      <div class="section-title"><span class="label">Headers</span></div>
      ${headers.map(param => this.parameterTemplate(param))}
    </section>
    `;
  }

  /**
   * Method that renders query parameters, if any
   *
   * @return {TemplateResult|string} Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  queryTemplate() {
    const headers = this.parametersValue.filter(item => item.binding === 'query');
    if (!headers.length) {
      return '';
    }
    return html`
    <section class="params-section">
      <div class="section-title"><span class="label">Query parameters</span></div>
      ${headers.map(param => this.parameterTemplate(param))}
    </section>
    `;
  }

  /**
   * Method that renders cookies, if any
   *
   * @return {TemplateResult|string} Empty string is returned when the section
   * should not be rendered, as documented in `lit-html` library.
   */
  cookieTemplate() {
    const headers = this.parametersValue.filter(item => item.binding === 'cookie');
    if (!headers.length) {
      return '';
    }
    return html`
    <section class="params-section">
      <div class="section-title"><span class="label">Cookies</span></div>
      ${headers.map(param => this.parameterTemplate(param))}
    </section>
    `;
  }
}
