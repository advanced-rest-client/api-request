/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import { html } from 'lit-html';
import { ns } from '@api-components/amf-helper-mixin';
import Oauth2, { oauth2GrantTypes } from '@advanced-rest-client/authorization/src/lib/ui/OAuth2.js'
import * as InputCache from '../InputCache.js';
import { AmfInputParser } from '../AmfInputParser.js';
import { Oauth2RamlCustomData } from '../Oauth2RamlCustomData.js';
import { AmfParameterMixin } from '../AmfParameterMixin.js';

const securityValue = Symbol("securityValue");
const apiValue = Symbol("apiValue");
const gtValue = Symbol("gtValue");

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/authorization').AuthUiInit} AuthUiInit */
/** @typedef {import('@api-components/amf-helper-mixin').DomainElement} DomainElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParametrizedSecurityScheme} ApiParametrizedSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').ApiNodeShape} ApiNodeShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityScheme} ApiSecurityScheme */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityOAuth2Settings} ApiSecurityOAuth2Settings */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityOAuth2Flow} ApiSecurityOAuth2Flow */
/** @typedef {import('@api-components/amf-helper-mixin').ApiCustomDomainProperty} ApiCustomDomainProperty */
/** @typedef {import('@api-components/amf-helper-mixin').ApiObjectNode} ApiObjectNode */
/** @typedef {import('@api-components/amf-helper-mixin').ApiArrayNode} ApiArrayNode */
/** @typedef {import('@api-components/amf-helper-mixin').ApiScalarNode} ApiScalarNode */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityScope} ApiSecurityScope */
/** @typedef {import('@api-components/amf-helper-mixin').ApiDataNodeUnion} ApiDataNodeUnion */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2CustomParameter} OAuth2CustomParameter */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.Oauth2GrantType} Oauth2GrantType */
/** @typedef {import('../../types').OperationParameter} OperationParameter */

export default class OAuth2Auth extends AmfParameterMixin(Oauth2) {
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

  // @ts-ignore
  get grantType() {
    return this[gtValue];
  }

  set grantType(value) {
    const old = this[gtValue];
    this[gtValue] = value;
    if (old !== value) {
      this.applyFlow(value);
    }
  }

  /**
   * @param {AuthUiInit} init
   */
  constructor(init) {
    super(init);

    /** @type string */
    this.overrideAuthorizationUri = undefined;
    /** @type string */
    this.overrideAccessTokenUri = undefined;
  }

  initializeApiModel() {
    const { amf, security } = this;
    if (!amf || !security) {
      this.setupOAuthDeliveryMethod();
      this.updateGrantTypes();
      return;
    }
    if (!security.types.includes(ns.aml.vocabularies.security.ParametrizedSecurityScheme)) {
      this.setupOAuthDeliveryMethod();
      this.updateGrantTypes();
      return;
    }
    const { scheme } = security;
    if (!scheme) {
      this.setupOAuthDeliveryMethod();
      this.updateGrantTypes();
      return;
    }
    const { type } = scheme;
    if (!type || type !== 'OAuth 2.0') {
      this.setupOAuthDeliveryMethod();
      this.updateGrantTypes();
      return;
    }
    this.setupOAuthDeliveryMethod(scheme);
    const config = /** @type ApiSecurityOAuth2Settings */ (scheme.settings);
    if (!config) {
      return;
    }
    this.preFillAmfData(config);
    this.autoHide();
    this.requestUpdate();
  }

  /**
   * @returns {OAuth2Authorization}
   */
  serialize() {
    const result = super.serialize();
    result.customData = {
      auth: {},
      token: {},
    };
    if (result.grantType === 'application') {
      result.grantType = 'client_credentials'
    }
    const { grantType } = result;
    switch (grantType) {
      case 'implicit':
        this.computeAuthCustomData(result);
        break;
      case 'authorization_code':
        this.computeAuthCustomData(result);
        this.computeTokenCustomData(result);
        break;
      case 'client_credentials':
      case 'password':
        this.computeTokenCustomData(result);
        break;
      default:
        this.computeAuthCustomData(result);
        this.computeTokenCustomData(result);
        break;
    }
    return result;
  }

  /**
   * @param {ApiSecurityScheme=} scheme
   */
  setupOAuthDeliveryMethod(scheme) {
    const info = this.getOauth2DeliveryMethod(scheme);
    if (this.oauthDeliveryMethod !== info.method) {
      this.oauthDeliveryMethod = info.method;
    }
    if (this.oauthDeliveryName !== info.name) {
      this.oauthDeliveryName = info.name;
    }
  }

  /**
   * Determines placement of OAuth authorization token location.
   * It can be either query parameter or header. This function
   * reads API spec to get this information or provides default if
   * not specifies.
   *
   * @param {ApiSecurityScheme} info Security AMF model
   * @returns {{method: string, name: string}}
   */
  getOauth2DeliveryMethod(info) {
    const result = {
      method: 'header',
      name: 'authorization'
    };
    if (!info) {
      return result;
    }
    if (Array.isArray(info.headers) && info.headers.length) {
      const [header] = info.headers;
      result.name = header.name;
      return result;
    }
    if (Array.isArray(info.queryParameters) && info.queryParameters.length) {
      const [param] = info.queryParameters;
      result.name = param.name;
      result.method = 'query';
      return result;
    }
    return result;
  }

  /**
   * Updates list of OAuth grant types supported by current endpoint.
   * The information should be available in RAML file.
   *
   * @param {string[]=} supportedTypes List of supported types. If empty
   * or not set then all available types will be displayed.
   */
  updateGrantTypes(supportedTypes) {
    const available = this.computeGrantList(supportedTypes);
    this.grantTypes = available;
    // check if current selection is still available
    const current = this.grantType;
    const hasCurrent = current ?
      available.some((item) => item.type === current) : false;
    if (!hasCurrent) {
      this.grantType = available[0].type;
    } else if (available.length === 1) {
      this.grantType = available[0].type;
    } else {
      this.applyFlow(current);
    }
  }

  /**
   * Computes list of grant types to render in the form.
   *
   * @param {string[]=} allowed List of types allowed by the
   * component configuration or API spec applied to this element. If empty
   * or not set then all OAuth 2.0 default types are returned.
   * @returns {Oauth2GrantType[]}
   */
  computeGrantList(allowed) {
    let defaults = /** @type Oauth2GrantType[] */ (Array.from(oauth2GrantTypes));
    if (!allowed || !allowed.length) {
      return defaults;
    }
    // eslint-disable-next-line no-param-reassign
    allowed = Array.from(allowed);
    // eslint-disable-next-line no-plusplus
    for (let i = defaults.length - 1; i >= 0; i--) {
      const index = allowed.indexOf(defaults[i].type);
      if (index === -1) {
        defaults.splice(i, 1);
      } else {
        allowed.splice(index, 1);
      }
    }
    if (allowed.length) {
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      allowed = allowed.map((item) => ({
        label: item,
        type: item
      }));
      // @ts-ignore
      defaults = defaults.concat(allowed);
    }
    return defaults;
  }

  /**
   * It's quite a bit naive approach to determine whether given model is RAML's
   * or OAS'. There is a significant difference of how to treat grant types
   * (in OAS it is called flows). While in OAS it is mandatory to define a grant type
   * (a flow) RAML has no such requirement. By default this component assumes that
   * all standard (OAuth 2 defined) grant types are supported when grant types are not
   * defined. So it is possible to not define them and the component will work.
   * However, in the AMF model there's always at least one grant type (a flow) whether
   * it's RAML's or OAS' and whether grant type is defined or not.
   *
   * To apply correct settings this component needs to know how to process the data.
   * If it's OAS then when changing grant type it also changes current settings
   * (like scopes, auth uri, etc). If the model is RAML's then change in current grant type
   * won't trigger settings setup.
   *
   * Note, this function returns true when there's no flows whatsoever. It's not
   * really what it means but it is consistent with component's logic.
   *
   * Current method is deterministic and when AMF model change this most probably stop
   * working. It tests whether there's a single grant type and this grant type
   * has no AMF's `security:flow` property.
   *
   * @param {ApiSecurityOAuth2Flow[]} flows List of current flows loaded with the AMF model.
   * @return {boolean} True if current model should be treated as RAML's model.
   */
  isRamlFlow(flows) {
    if (!Array.isArray(flows)) {
      return true;
    }
    let result = false;
    if (flows.length === 1) {
      const type = flows[0].flow;
      if (!type) {
        result = true;
      }
    }
    return result;
  }

  /**
   * Reads API security definition and applies in to the view as predefined
   * values.
   *
   * @param {ApiSecurityOAuth2Settings} model AMF model describing settings of the security
   * scheme
   */
  preFillAmfData(model){
    if (!model) {
      return;
    }
    const { flows, authorizationGrants } = model;
    if (Array.isArray(flows) && !this.isRamlFlow(flows)) {
      this.preFillFlowData(flows);
      return;
    }

    const [flow] = flows;
    this.authorizationUri = this.overrideAuthorizationUri || flow.authorizationUri;
    this.accessTokenUri = this.overrideAccessTokenUri || flow.accessTokenUri || '';
    this.scopes = (flow.scopes || []).map(s => s.name);
    const settingsExtension = this.findOauth2CustomSettings(model);
    const grants = this.computeGrants(authorizationGrants, settingsExtension);
    
    if (grants.length) {
      const index = grants.indexOf('code');
      if (index !== -1) {
        grants[index] = 'authorization_code';
      }
      this.updateGrantTypes(grants);
    } else {
      this.updateGrantTypes();
    }
    this.setupAnnotationParameters(settingsExtension);
    this.pkce = this.readPkceValue(model);
  }

  /**
   * API console supports an annotation with additional settings form the OAuth2 authorization
   * defined in https://github.com/raml-org/raml-annotations/blob/master/annotations/security-schemes/oauth-2-custom-settings.raml
   * 
   * This reads (RAML) annotations to build the UI for these settings.
   *
   * @param {ApiSecurityOAuth2Settings} model AMF model describing settings of the security
   * scheme
   * @returns {ApiCustomDomainProperty|null} The extension definition or null
   */
  findOauth2CustomSettings(model) {
    const { customDomainProperties=[] } = model;
    const properties = ['accessTokenSettings', 'authorizationGrants', 'authorizationSettings'];
    return customDomainProperties.find((property) => {
      const node = /** @type ApiObjectNode */ (property.extension);
      if (!node.properties || !node.types.includes(ns.aml.vocabularies.data.Object)) {
        return false;
      }
      return Object.keys(node.properties).some(name => properties.includes(name));
    });
  }

  /**
   * Computes the final list of authorization grants defined in the spec and with applied annotation defined in
   * https://github.com/raml-org/raml-annotations/blob/master/annotations/security-schemes/oauth-2-custom-settings.raml
   * 
   * @param {string[]} grans The API spec annotation grants
   * @param {ApiCustomDomainProperty=} customProperty The domain extension with the custom data
   * @returns {string[]} The list of authorization grants to apply to the current operation.
   */
  computeGrants(grans=[], customProperty) {
    if (!customProperty || !customProperty.extension || !customProperty.extension.types.includes(ns.aml.vocabularies.data.Object)) {
      return grans;
    }
    const typed = /** @type ApiObjectNode */ (customProperty.extension);
    if (!typed.properties.authorizationGrants) {
      return grans;
    }
    const array = /** @type ApiArrayNode */ (typed.properties.authorizationGrants);
    const addedGrants = [];
    array.members.forEach((g) => {
      if (!g.types.includes(ns.aml.vocabularies.data.Scalar)) {
        return;
      }
      const scalar = /** @type ApiScalarNode */ (g);
      if (scalar.value) {
        addedGrants.push(scalar.value);
      }
    });
    let result = grans;
    if (typed.properties.ignoreDefaultGrants) {
      result = [];
    }
    result = result.concat(addedGrants);
    return result;
  }

  /**
   * Pre-fills authorization data with OAS' definition of a grant type
   * which they call a flow. This method populates form with the information
   * find in the model.
   *
   * It tries to match a flow to currently selected `grantType`. When no match
   * then it takes first flow.
   *
   * Note, flow data are applied when `grantType` change.
   *
   * @param {ApiSecurityOAuth2Flow[]} flows List of flows in the authorization description.
   */
  preFillFlowData(flows) {
    // first step is to select the right flow.
    // If the user already selected a grant type before then it this looks
    // for a flow for already selected grant type. If its not present then
    // it uses first available flow.
    let flow = this.flowForType(flows, this.grantType);
    if (!flow) {
      [flow] = flows;
    }
    // finally sets grant types from flows
    const grantTypes = this.readFlowsTypes(flows);
    this.updateGrantTypes(grantTypes);
  }

  /**
   * Searches for a flow in the list of flows for given name.
   *
   * @param {ApiSecurityOAuth2Flow[]} flows List of flows to search in.
   * @param {string=} type Grant type
   * @return {any|undefined}
   */
  flowForType(flows, type) {
    if (!type) {
      return undefined;
    }
    for (let i = 0, len = flows.length; i < len; i++) {
      const flow = flows[i];
      if (flow.flow === type) {
        // true for `implicit`, `password`
        return flow;
      }
      if (type === 'authorization_code' && flow.flow === 'authorizationCode') {
        return flow;
      }
      if (type === 'client_credentials' && flow.flow === 'clientCredentials') {
        return flow;
      }
    }
    return undefined;
  }

  /**
   * Reads list of scopes from a flow.
   *
   * @param {ApiSecurityOAuth2Flow} flow A flow to process.
   * @return {string[]} List of scopes required by an endpoint / API.
   */
  readFlowScopes(flow) {
    const { security } = this;
    let scopes = this.readSecurityScopes(flow.scopes);
    if (scopes || !security) {
      return scopes;
    }
    // if scopes are not defined in the operation then they may be defined in
    // security settings.
    const config = /** @type ApiSecurityOAuth2Settings */ (security.scheme.settings);
    if (!config || !config.flows) {
      return undefined;
    }
    const [mainFlow] = config.flows;
    if (mainFlow) {
      scopes = this.readSecurityScopes(mainFlow.scopes);
    }
    return scopes;
  }

  /**
   * Reads list of grant types from the list of flows.
   *
   * @param {ApiSecurityOAuth2Flow[]} flows List of flows to process.
   * @return {string[]} Grant types supported by this authorization.
   */
  readFlowsTypes(flows) {
    const grants = [];
    flows.forEach((flow) => {
      let type = flow.flow;
      if (type === 'authorizationCode') {
        type = 'authorization_code';
      } else if (type === 'clientCredentials') {
        type = 'client_credentials';
      }
      grants[grants.length] = type;
    });
    return grants;
  }

  /**
   * Applies settings from a flow to current properties.
   * OAS' flows may define different configuration for each flow.
   * This function is called each time a grant type change. If current settings
   * does not contain flows then this is ignored.
   *
   * @param {string=} name Set grant type
   */
  applyFlow(name) {
    if (!name) {
      return;
    }
    const { security } = this;
    if (!security || !security.scheme || !security.scheme.settings) {
      return;
    }
    const config = /** @type ApiSecurityOAuth2Settings */ (security.scheme.settings);
    const { flows } = config;
    if (!Array.isArray(flows) || this.isRamlFlow(flows)) {
      return;
    }
    if (name === 'client_credentials') {
      name = 'clientCredentials';
    } else if (name === 'authorization_code') {
      name = 'authorizationCode';
    }
    const flow = flows.find(team => team.flow === name);
    // sets basic oauth properties.
    this.scopes = flow ? this.readFlowScopes(flow) : [];
    this.authorizationUri = this.overrideAuthorizationUri || flow.authorizationUri || '';
    this.accessTokenUri = this.overrideAccessTokenUri || flow.accessTokenUri || '';
  }

  /**
   * Extracts scopes list from the security definition
   * @param {ApiSecurityScope[]} scopes
   * @return {string[]|undefined}
   */
  readSecurityScopes(scopes) {
    if (!scopes) {
      return undefined;
    }
    const result = scopes.map(s => s.name).filter(s => !!s);
    if (!result.length) {
      return undefined;
    }
    return result;
  }

  /**
   * Checks whether the security scheme is annotated with the `pkce` annotation.
   * This annotation is published at https://github.com/raml-org/raml-annotations/tree/master/annotations/security-schemes
   * @param {ApiSecurityOAuth2Settings} model Model for the security settings
   * @returns {boolean|undefined} True if the security settings are annotated with PKCE extension
   */
  readPkceValue(model) {
    const { customDomainProperties } = model;
    if (!Array.isArray(customDomainProperties) || !customDomainProperties.length) {
      return undefined;
    }
    const pkce = customDomainProperties.find(e => e.name === 'pkce');
    if (!pkce) {
      return undefined;
    }
    const info = /** @type ApiScalarNode */ (pkce.extension);
    if (info.dataType === ns.w3.xmlSchema.boolean) {
      return info.value === 'true';
    }
    return undefined;
  }

  /**
   * Adds `customData` property values that can be applied to the
   * authorization request.
   *
   * @param {OAuth2Authorization} detail Token request detail object. The object is passed
   * by reference so no need for return value
   */
  computeAuthCustomData(detail) {
    const all = /** @type OperationParameter[] */ (this.parametersValue);
    const params = all.filter(p => p.binding === 'authQuery');
    if (params.length) {
      detail.customData.auth.parameters = this.computeCustomParameters(params, 'authQuery');
    }
  }

  /**
   * Adds `customData` property values that can be applied to the
   * token request.
   *
   * @param {OAuth2Authorization} detail Token request detail object. The object is passed
   * by reference so no need for return value
   */
  computeTokenCustomData(detail) {
    const params = /** @type OperationParameter[] */ (this.parametersValue);
    const tqp = params.filter(p => p.binding === 'tokenQuery');
    const th = params.filter(p => p.binding === 'tokenHeader');
    const tb = params.filter(p => p.binding === 'tokenBody');
    if (tqp.length) {
      detail.customData.token.parameters = this.computeCustomParameters(tqp, 'tokenQuery');
    }
    if (th.length) {
      detail.customData.token.headers = this.computeCustomParameters(th, 'tokenHeader');
    }
    if (tb.length) {
      detail.customData.token.body = this.computeCustomParameters(tb, 'tokenBody');
    }
  }

  /**
   * Sets up annotation supported variables to apply form view for:
   * - authorization query parameters
   * - authorization headers
   * - token query parameters
   * - token headers
   * - token body
   *
   * @param {ApiCustomDomainProperty} customProperty Annotation applied to the OAuth settings
   */
  setupAnnotationParameters(customProperty) {
    this.parametersValue = /** @type OperationParameter[] */ ([]);
    /* istanbul ignore if */
    if (!customProperty || !customProperty.extension) {
      return;
    }
    const typed = /** @type ApiObjectNode */ (customProperty.extension);
    const authSettings = /** @type ApiObjectNode */ (typed.properties.authorizationSettings);
    const tokenSettings = /** @type ApiObjectNode */ (typed.properties.accessTokenSettings);
    if (authSettings) {
      const qp = /** @type ApiObjectNode */ (authSettings.properties.queryParameters);
      if (qp && qp.properties) {
        this.setupAuthRequestQueryParameters(qp.properties);
      }
    }
    if (tokenSettings) {
      const qp = /** @type ApiObjectNode */ (tokenSettings.properties.queryParameters);
      const headerParams = /** @type ApiObjectNode */ (tokenSettings.properties.headers);
      const bodyParams = /** @type ApiObjectNode */ (tokenSettings.properties.body);
      if (qp && qp.properties) {
        this.setupTokenRequestQueryParameters(qp.properties);
      }
      if (headerParams && headerParams.properties) {
        this.setupTokenRequestHeaders(headerParams.properties);
      }
      if (bodyParams && bodyParams.properties) {
        this.setupTokenRequestBody(bodyParams.properties);
      }
    }
  }

  /**
   * Appends a list of parameters to the list of rendered parameters
   * @param {ApiParameter[]} list
   * @param {string} source
   */
  appendToParams(list, source) {
    const params = this.parametersValue;
    if (Array.isArray(list)) {
      list.forEach((param) => {
        params.push({
          paramId: param.id,
          parameter: { ...param, binding: source },
          binding: source,
          source,
          schema: param.schema,
          schemaId: param.schema && param.schema.id ? param.schema.id : undefined,
        });
      });
    }
  }

  /**
   * Sets up query parameters to be used with authorization request.
   *
   * @param {{[key: string]: ApiDataNodeUnion}} properties List of parameters from the annotation.
   */
  setupAuthRequestQueryParameters(properties) {
    const source = 'authQuery';
    this.parametersValue = this.parametersValue.filter(item => item.source !== source);
    const factory = new Oauth2RamlCustomData();
    const items = factory.readParams(properties);
    this.appendToParams(items, source);
  }

  /**
   * Sets up query parameters to be used with token request.
   *
   * @param {{[key: string]: ApiDataNodeUnion}} properties List of parameters from the annotation.
   */
  setupTokenRequestQueryParameters(properties) {
    const source = 'tokenQuery';
    this.parametersValue = this.parametersValue.filter(item => item.source !== source);
    const factory = new Oauth2RamlCustomData();
    const items = factory.readParams(properties);
    this.appendToParams(items, source);
  }

  /**
   * Sets up headers to be used with token request.
   *
   * @param {{[key: string]: ApiDataNodeUnion}} properties params List of parameters from the annotation.
   */
  setupTokenRequestHeaders(properties) {
    const source = 'tokenHeader';
    this.parametersValue = this.parametersValue.filter(item => item.source !== source);
    const factory = new Oauth2RamlCustomData();
    const items = factory.readParams(properties);
    this.appendToParams(items, source);
  }

  /**
   * Sets up body parameters to be used with token request.
   *
   * @param {{[key: string]: ApiDataNodeUnion}} properties params List of parameters from the annotation.
   */
  setupTokenRequestBody(properties) {
    const source = 'tokenBody';
    this.parametersValue = this.parametersValue.filter(item => item.source !== source);
    const factory = new Oauth2RamlCustomData();
    const items = factory.readParams(properties);
    this.appendToParams(items, source);
  }

  /**
   * Computes list of parameter values from current model.
   *
   * This function ignores empty values if they are not required.
   * Required property are always included, even if the value is not set.
   *
   * @param {OperationParameter[]} params Model for form inputs.
   * @param {string} reportKey The key name in the report.
   * @return {OAuth2CustomParameter[]|undefined} Array of objects with `name` and `value`
   * properties or undefined if `params` is empty or no values are available.
   */
  computeCustomParameters(params, reportKey) {
    const result = /** @type OAuth2CustomParameter[] */ ([]);
    const report = AmfInputParser.reportRequestInputs(params.map(p => p.parameter), InputCache.getStore(this.target, this.globalCache), this.nilValues);
    const values = report[reportKey];
    if (!values) {
      return result;
    }
    Object.keys(values).forEach((key) => {
      const value = values[key];
      const info = params.find(p => p.parameter.name === key);
      if (info.parameter.required !== true) {
        const type = typeof value;
        if (type === 'number') {
          if (!value && value !== 0) {
            return;
          }
        } 
        if (type === 'string') {
          if (!value) {
            return;
          }
        } 
        if (Array.isArray(value)) {
          if (!value[0]) {
            return;
          }
        } 
        if (type === 'undefined') {
          return;
        }
      }
      result.push({
        name: key,
        value: value || ''
      });
    });
    return result;
  }

  oauth2CustomPropertiesTemplate() {
    const params = /** @type OperationParameter[] */ (this.parametersValue);
    const aqp = params.filter(p => p.binding === 'authQuery');
    const tqp = params.filter(p => p.binding === 'tokenQuery');
    const th = params.filter(p => p.binding === 'tokenHeader');
    const tb = params.filter(p => p.binding === 'tokenBody');
    return html`
    ${aqp.length ? html`
    <section class="params-section">
      <div class="section-title"><span class="label">Authorization request query parameters</span></div>
      ${aqp.map(param => this.parameterTemplate(param))}
    </section>
    ` : ''}
    ${tqp.length ? html`
    <section class="params-section">
      <div class="section-title"><span class="label">Token request query parameters</span></div>
      ${tqp.map(param => this.parameterTemplate(param))}
    </section>
    ` : ''}
    ${th.length ? html`
    <section class="params-section">
      <div class="section-title"><span class="label">Token request headers</span></div>
      ${th.map(param => this.parameterTemplate(param))}
    </section>
    ` : ''}
    ${tb.length ? html`
    <section class="params-section">
      <div class="section-title"><span class="label">Token request body</span></div>
      ${tb.map(param => this.parameterTemplate(param))}
    </section>
    ` : ''}
    `;
  }
}
