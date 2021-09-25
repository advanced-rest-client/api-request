/* eslint-disable class-methods-use-this */
import { html } from 'lit-html';
import { ns } from '@api-components/amf-helper-mixin';
import '@advanced-rest-client/highlight/arc-marked.js';
import ApiUiBase from './ApiUiBase.js';
import * as InputCache from '../InputCache.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/authorization').AuthUiInit} AuthUiInit */
/** @typedef {import('@api-components/amf-helper-mixin').DomainElement} DomainElement */
/** @typedef {import('@api-components/amf-helper-mixin').ParametrizedSecurityScheme} ParametrizedSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').ApiNodeShape} ApiNodeShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@api-components/amf-helper-mixin').ApiPropertyShape} ApiPropertyShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiShapeUnion} ApiShapeUnion */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.RamlCustomAuthorization} RamlCustomAuthorization */
/** @typedef {import('../../types').OperationParameter} OperationParameter */

export default class CustomAuth extends ApiUiBase {
  /**
   * @param {AuthUiInit} init
   */
  constructor(init) {
    super(init);
    this.clearInit();

    this.toggleDescription = this.toggleDescription.bind(this);
  }

  clearInit() {
    /** @type {string} */
    this.schemeName = undefined;
    /** @type {string} */
    this.schemeDescription = undefined;
    /** @type {boolean} */
    this.compatibility = undefined;
    /** @type {boolean} */
    this.descriptionOpened = undefined;
  }

  reset() {
    this.clearInit();
    this.clearCache();
  }

  initializeApiModel() {
    const { amf, security } = this;
    this.clearInit();
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
    if (!type || !type.startsWith('x-')) {
      return;
    }
    const params = this.parametersValue;
    const { headers, queryParameters, queryString } = scheme;
    if (Array.isArray(headers)) {
      headers.forEach((p) => {
        const param = { ...p, required: true };
        params.push({
          binding: param.binding,
          paramId: param.id,
          parameter: param,
          source,
          schemaId: param.schema && param.schema.id,
          schema: param.schema,
        });
      });
    }
    let addedParameters = false;
    if (Array.isArray(queryParameters)) {
      queryParameters.forEach((p) => {
        addedParameters = true;
        const param = { ...p, required: true };
        params.push({
          binding: param.binding,
          paramId: param.id,
          parameter: param,
          source,
          schemaId: param.schema && param.schema.id,
          schema: param.schema,
        });
      });
    }
    if (!addedParameters && queryString) {
      const shape = /** @type ApiNodeShape */ (queryString);
      const { properties } = shape;
      const binding = 'query';
      if (!properties) {
        params.push(this.createParameterFromSchema(shape, binding, source));
      } else {
        properties.forEach((property) => {
          params.push(this.createParameterFromProperty(property, binding, source));
        });
      }
    }
    this.schemeName = security.name || scheme.name;
    this.schemeDescription = scheme.description;
    this.requestUpdate();
    this.notifyChange();
  }

  /**
   * @param {ApiShapeUnion} shape
   * @param {string} binding
   * @param {string} source
   * @returns {OperationParameter}
   */
  createParameterFromSchema(shape, binding, source) {
    const { id, name } = shape;
    const constructed = /** @type ApiParameter */ ({
      id,
      binding,
      schema: shape,
      name,
      examples: [],
      payloads: [],
      types: [ns.aml.vocabularies.apiContract.Parameter],
      required: false,
    });
    return {
      binding,
      paramId: id,
      parameter: constructed,
      source,
      schemaId: id,
      // @ts-ignore
      schema: shape,
    };
  }

  /**
   * @param {ApiPropertyShape} property
   * @param {string} binding
   * @param {string} source
   * @returns {OperationParameter}
   */
  createParameterFromProperty(property, binding, source) {
    const { id, range, name, minCount } = property;
    const constructed = /** @type ApiParameter */ ({
      id,
      binding,
      schema: range,
      name,
      examples: [],
      payloads: [],
      types: [ns.aml.vocabularies.apiContract.Parameter],
      required: minCount > 0,
    });
    return {
      binding,
      paramId: id,
      parameter: constructed,
      source,
      schemaId: property.id,
      // @ts-ignore
      schema: property,
    };
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
   * Restores previously serialized values
   * @param {RamlCustomAuthorization} state
   */
  restore(state) {
    if (!state) {
      return;
    }
    this.restoreModelValue('header', state.header);
    this.restoreModelValue('query', state.query);
    this.requestUpdate();
  }

  /**
   * @param {string} binding 
   * @param {RamlCustomAuthorization} restored 
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
   * @returns {RamlCustomAuthorization}
   */
  serialize() {
    const params = /** @type OperationParameter[] */ (this.parametersValue);
    const result = /** @type RamlCustomAuthorization */ ({});
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
    return /** @type RamlCustomAuthorization */ (result);
  }

  /**
   * @returns {boolean}
   */
  validate() {
    const nils = this.nilValues;
    const params = /** @type OperationParameter[] */ (this.parametersValue);
    return !params.some((param) => {
      if (nils.includes(param.paramId)) {
        return false;
      }
      const value = InputCache.get(this.target, param.paramId, this.globalCache);
      if (!value && !param.parameter.required) {
        return false;
      }
      return !value;
    });
  }

  /**
   * Toggles value of `descriptionOpened` property.
   *
   * This is a utility method for UI event handling. Use `descriptionOpened`
   * attribute directly instead of this method.
   */
  toggleDescription() {
    this.descriptionOpened = !this.descriptionOpened;
    this.requestUpdate();
  }

  /**
   * @returns {TemplateResult}
   */
  render() {
    return html`
    ${this.titleTemplate()}
    <form autocomplete="on" class="custom-auth">
      ${this.headersTemplate()}
      ${this.queryTemplate()}
    </form>
    `;
  }

  titleTemplate() {
    const {
      schemeName,
      schemeDescription,
      compatibility,
      descriptionOpened,
    } = this;
    if (!schemeName) {
      return '';
    }
    return html`
    <div class="subtitle">
      <span>Scheme: ${schemeName}</span>
      ${schemeDescription ? html`<anypoint-icon-button
        class="hint-icon"
        title="Toggle description"
        aria-label="Activate to toggle the description"
        ?compatibility="${compatibility}"
        @click="${this.toggleDescription}"
      >
        <arc-icon icon="help"></arc-icon>
      </anypoint-icon-button>` : ''}
    </div>
    ${schemeDescription && descriptionOpened ? html`<div class="docs-container">
      <arc-marked .markdown="${schemeDescription}" class="main-docs" sanitize>
        <div slot="markdown-html" class="markdown-body"></div>
      </arc-marked>
    </div>` : ''}`;
  }

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

  queryTemplate() {
    const params = this.parametersValue.filter(item => item.binding === 'query');
    if (!params.length) {
      return '';
    }
    return html`
    <section class="params-section">
      <div class="section-title"><span class="label">Query parameters</span></div>
      ${params.map(param => this.parameterTemplate(param))}
    </section>
    `;
  }
}
