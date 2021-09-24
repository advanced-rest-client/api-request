/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2021 The Advanced REST client authors <arc@mulesoft.com>
Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.
*/
import { html, LitElement } from 'lit-element';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { AmfHelperMixin, AmfSerializer } from '@api-components/amf-helper-mixin';
import { apiFormStyles } from '@api-components/api-forms';
import { ApiUrlDataModel } from '@api-components/api-url';
import { TelemetryEvents } from '@advanced-rest-client/arc-events';
import { v4 } from '@advanced-rest-client/uuid-generator';
import { HeadersParser } from '@advanced-rest-client/arc-headers'
import '@api-components/api-url/api-url-editor.js';
import '@api-components/api-url/api-url-params-editor.js';
import '@api-components/api-headers/api-headers-editor.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-item/anypoint-item-body.js';
import '@anypoint-web-components/anypoint-radio-button/anypoint-radio-button.js';
import '@anypoint-web-components/anypoint-radio-button/anypoint-radio-group.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@api-components/api-server-selector/api-server-selector.js';
import '@advanced-rest-client/body-editor/body-formdata-editor.js';
import '@advanced-rest-client/body-editor/body-multipart-editor.js';
import '@advanced-rest-client/body-editor/body-raw-editor.js';
import { ifProperty } from "@advanced-rest-client/body-editor";
import elementStyles from '../styles/Editor.styles.js';
import { cachePayloadValue, getPayloadValue, readCachePayloadValue } from "../lib/PayloadUtils.js";
import { ensureContentType, generateHeaders } from "../lib/Utils.js";
import { SecurityProcessor } from '../lib/SecurityProcessor.js';
import { AmfParameterMixin } from '../lib/AmfParameterMixin.js';
import { AmfInputParser } from '../lib/AmfInputParser.js';
import { applyUrlParameters, applyUrlVariables } from '../lib/UrlUtils.js';
import * as InputCache from '../lib/InputCache.js';
import '../../api-authorization-editor.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.FormItem} FormItem */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ApiTypes.ApiType} ApiType */
/** @typedef {import('@advanced-rest-client/authorization').Oauth2Credentials} Oauth2Credentials */
/** @typedef {import('@advanced-rest-client/body-editor').BodyRawEditorElement} BodyRawEditorElement */
/** @typedef {import('@advanced-rest-client/body-editor').BodyFormdataEditorElement} BodyFormdataEditorElement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiEndPoint} ApiEndPoint */
/** @typedef {import('@api-components/amf-helper-mixin').ApiOperation} ApiOperation */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityRequirement} ApiSecurityRequirement */
/** @typedef {import('@api-components/amf-helper-mixin').ApiPayload} ApiPayload */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@anypoint-web-components/anypoint-listbox').AnypointListbox} AnypointListbox */
/** @typedef {import('@anypoint-web-components/anypoint-radio-button/index').AnypointRadioGroupElement} AnypointRadioGroupElement */
/** @typedef {import('../elements/ApiAuthorizationEditorElement').default} ApiAuthorizationEditorElement */
/** @typedef {import('../types').ApiConsoleRequest} ApiConsoleRequest */
/** @typedef {import('../types').PopulationInfo} PopulationInfo */
/** @typedef {import('../types').SecuritySelectorListItem} SecuritySelectorListItem */
/** @typedef {import('../types').OperationParameter} OperationParameter */

export const EventCategory = 'API Request editor';

export const operationValue = Symbol('currentModel');
export const endpointValue = Symbol('endpointValue');
export const processOperation = Symbol('processOperation');
export const processEndpoint = Symbol('processEndpoint');
export const processSecurity = Symbol('processSecurity');
export const appendToParams = Symbol('appendToParams');
export const securityList = Symbol('securityList');
export const updateServerParameters = Symbol('updateServerParameters');
export const updateEndpointParameters = Symbol('updateEndpointParameters');
export const authSelectorHandler = Symbol('authSelectorHandler');
export const mediaTypeSelectHandler = Symbol('mediaTypeSelectHandler');
export const modelBodyEditorChangeHandler = Symbol('modelBodyEditorChangeHandler');
export const rawBodyChangeHandler = Symbol('rawBodyChangeHandler');
export const authorizationTemplate = Symbol('authorizationTemplate');
export const authorizationSelectorTemplate = Symbol('authorizationSelectorTemplate');
export const authorizationSelectorItemTemplate = Symbol('authorizationSelectorItemTemplate');
export const mediaTypeSelectorTemplate = Symbol('mediaTypeSelectorTemplate');
export const bodyTemplate = Symbol('bodyTemplate');
export const formDataEditorTemplate = Symbol('formDataEditorTemplate');
export const multipartEditorTemplate = Symbol('multipartEditorTemplate');
export const rawEditorTemplate = Symbol('rawEditorTemplate');
export const headersTemplate = Symbol('headersTemplate');
export const parametersTemplate = Symbol('parametersTemplate');

export class ApiRequestEditorElement extends AmfParameterMixin(AmfHelperMixin(EventsTargetMixin(LitElement))) {
  get styles() {
    return [
      apiFormStyles,
      elementStyles,
    ];
  }

  static get properties() {
    return {
      /** 
       * The currently selected media type for the payloads.
       */
      mimeType: { type: String, reflect: true, },
      /**
       * An `@id` of selected AMF shape. When changed it computes
       * method model for the selection.
       */
      selected: { type: String },
      /**
       * Hides the URL editor from the view.
       * The editor is still in the DOM.
       */
      noUrlEditor: { type: Boolean },
      /**
       * When set it renders a label with the computed URL.
       * This intended to be used with `noUrlEditor` set to true.
       * This way it replaces the editor with a simple label.
       */
      urlLabel: { type: Boolean },
      /**
       * A base URI for the API. To be set if RAML spec is missing `baseUri`
       * declaration and this produces invalid URL input. This information
       * is passed to the URL editor that prefixes the URL with `baseUri` value
       * if passed URL is a relative URL.
       */
      baseUri: { type: String },
      /**
       * If set it computes `hasOptional` property and shows checkbox in the
       * form to show / hide optional properties.
       */
      allowHideOptional: { type: Boolean },
      /**
       * If set, enable / disable param checkbox is rendered next to each
       * form item.
       */
      allowDisableParams: { type: Boolean },
      /**
       * When set, renders "add custom" item button.
       * If the element is to be used without AMF model this should always
       * be enabled. Otherwise users won't be able to add a parameter.
       */
      allowCustom: { type: Boolean },
      /**
       * API server definition from the AMF model.
       *
       * This value to be set when partial AMF model for an endpoint is passed
       * instead of web api to be passed to the `api-url-data-model` element.
       *
       * Do not set with full AMF web API model.
       */
      server: { type: Object },
      /**
       * Supported protocol versions.
       *
       * E.g.
       *
       * ```json
       * ["http", "https"]
       * ```
       *
       * This value to be set when partial AMF model for an endpoint is passed
       * instead of web api to be passed to the `api-url-data-model` element.
       *
       * Do not set with full AMF web API model.
       */
      protocols: { type: Array },
      /**
       * API version name.
       *
       * This value to be set when partial AMF model for an endpoint is passed
       * instead of web api to be passed to the `api-url-data-model` element.
       *
       * Do not set with full AMF web API model.
       */
      version: { type: String },
      /**
       * Enables compatibility with Anypoint styling
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set all controls are disabled in the form
       */
      disabled: { type: Boolean },
      /**
       * OAuth2 redirect URI.
       * This value **must** be set in order for OAuth 1/2 to work properly.
       */
      redirectUri: { type: String },
      /**
       * Headers for the request.
       */
      _headers: { type: String },
      /**
       * Final request URL including settings like `baseUri`, AMF
       * model settings and user provided parameters.
       * This value is always computed by the `api-url-editor` even if it's
       * hidden from the view.
       */
      url: { type: String },
      /**
       * Current content type as defined by headers.
       */
      _headerContentType: { type: String },
      /**
       * Current content type as defined by body editor.
       */
      _bodyContentType: { type: String },
      /**
       * Computed list of headers in the AMF model
       */
      _apiHeaders: { type: Array },
      /**
       * Defined by the API payload data.
       */
      _apiPayload: { type: Array },
      /**
       * Flag set when the request is being made.
       */
      _loadingRequest: { type: Boolean },
      /**
       * Generated request ID when the request is sent. This value is reported
       * in send and abort events
       */
      _requestId: { type: String },
      /**
       * Request query parameters view model
       */
      _queryModel: { type: Array },
      /**
       * Request path parameters view model
       */
      _pathModel: { type: Array },

      _endpointUri: { type: String },
      _apiBaseUri: { type: String },
      /**
       * Holds the value of the currently selected server
       * Data type: URI
       */
      serverValue: { type: String },
      /**
       * Holds the type of the currently selected server
       * Values: `server` | `uri` | `custom`
       */
      serverType: { type: String },
      /**
       * Optional property to set
       * If true, the server selector is not rendered
       */
      noServerSelector: { type: Boolean },
      /**
       * Optional property to set
       * If true, the server selector custom base URI option is rendered
       */
      allowCustomBaseUri: { type: Boolean },
      /**
       * List of credentials source
       */
      credentialsSource: { type: Array },
      /**
       * When enabled, does not clear cache on AMF change
       */
      persistCache: { type: Boolean },
      /** 
       * The index of the selected security definition to apply.
       */
      selectedSecurity: { type: Number },
      /** 
       * When set it applies the authorization values to the request dispatched
       * with the API request event.
       * If possible, it applies the authorization values to query parameter or headers
       * depending on the configuration.
       * 
       * When the values arr applied to the request the authorization config is kept in the
       * request object, but its `enabled` state is always `false`, meaning other potential
       * processors should ignore this values.
       * 
       * If this property is not set then the application hosting this component should
       * process the authorization data and apply them to the request.
       */
      applyAuthorization: { type: Boolean },
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
    };
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    const old = this._selected;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this._selected = value;
    this.requestUpdate('selected', old);
    this._selectedChanged();
    this._updateServers();
    this.readUrlData();
  }

  /**
   * @returns {string} The HTTP method name.
   */
  get httpMethod() {
    const op = this[operationValue];
    if (!op) {
      return undefined;
    }
    return op.method;
  }

  get headers() {
    return this._headers;
  }

  get contentType() {
    return this._headerContentType || this._bodyContentType;
  }

  get apiHeaders() {
    return this._apiHeaders;
  }

  get apiPayload() {
    return this._apiPayload;
  }

  get loadingRequest() {
    return this._loadingRequest;
  }

  get requestId() {
    return this._requestId;
  }

  get serversCount() {
    return this._serversCount;
  }

  set serversCount(value) {
    const old = this._serversCount;
    if (old === value) {
      return;
    }
    this._serversCount = value;
    this._updateServer();
    this.requestUpdate('serversCount', old);
  }

  get serverValue() {
    return this._serverValue;
  }

  set serverValue(value) {
    const old = this._serverValue;
    if (old === value) {
      return;
    }
    this._serverValue = value;
    this._updateServer();
    this.readUrlData();
    this.requestUpdate('serverValue', old);
  }

  get serverType() {
    return this._serverType;
  }

  set serverType(value) {
    const old = this._serverType;
    if (old === value) {
      return;
    }
    this._serverType = value;
    this._updateServer();
    this.readUrlData();
    this.requestUpdate('serverType', old);
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    if (old === value) {
      return;
    }
    this._baseUri = value;
    this.readUrlData();
    this.requestUpdate('baseUri', old);
  }

  get server() {
    return this._server;
  }

  set server(value) {
    const old = this._server;
    if (old === value) {
      return;
    }
    this._server = value;
    this.requestUpdate('server', old);
    this.readUrlData();
  }

  get protocols() {
    return this._protocols;
  }

  set protocols(value) {
    const old = this._protocols;
    if (old === value) {
      return;
    }
    this._protocols = value;
    this.requestUpdate('protocols', old);
    this.readUrlData();
  }

  get version() {
    return this._version;
  }

  set version(value) {
    const old = this._version;
    if (old === value) {
      return;
    }
    this._version = value;
    this.requestUpdate('version', old);
    this.readUrlData();
  }

  /**
   * This is the final computed value for the baseUri to propagate downwards
   * If baseUri is defined, return baseUri
   * Else, return the selectedServerValue if serverType is not `server`
   */
  get effectiveBaseUri() {
    if (this.baseUri) {
      return this.baseUri;
    }
    if (this.serverType !== 'server') {
      return this.serverValue;
    }
    return '';
  }

  /**
   * @return {boolean} True when there are not enough servers to render the selector
   */
  get _serverSelectorHidden() {
    const { serversCount = 0, noServerSelector } = this;
    return serversCount < 2 || noServerSelector;
  }

  /**
   * @returns {SecuritySelectorListItem[]|undefined} The security requirement for the operation or undefined.
   */
  get security() {
    const items = this[securityList];
    if (Array.isArray(items) && items.length) {
      return items;
    }
    return undefined;
  }

  /**
   * @returns {ApiPayload|undefined} The currently rendered payload, if any.
   */
  get payload() {
    const { payloads } = this;
    if (!payloads) {
      return undefined;
    }
    const { mimeType } = this;
    /** @type ApiPayload */
    let payload;
    if (mimeType) {
      payload = payloads.find(i => i.mediaType === mimeType);
    }
    if (!payload) {
      [payload] = payloads;
    }
    return payload;
  }

  /**
   * @returns {ApiPayload[]|undefined} The list of all possible payloads for this operation.
   */
  get payloads() {
    const operation = this[operationValue];
    if (!operation) {
      return undefined;
    }
    const { request } = operation;
    if (!request) {
      return undefined;
    }
    const { payloads } = request;
    if (!Array.isArray(payloads) || !payloads.length) {
      return undefined;
    }
    return payloads;
  }

  /**
   * @constructor
   */
  constructor() {
    super();
    this._responseHandler = this._responseHandler.bind(this);
    this._authRedirectChangedHandler = this._authRedirectChangedHandler.bind(this);
    this._populateAnnotatedFieldsHandler = this._populateAnnotatedFieldsHandler.bind(this);

    this.urlLabel = false;
    this.outlined = false;
    this.compatibility = false;
    this.readOnly = false;
    this.disabled = false;
    this.noServerSelector = false;
    this.allowCustom = false;
    this.noUrlEditor = false;
    this.allowDisableParams = false;
    this.allowHideOptional = false;
    this.allowCustomBaseUri = false;
    /** @type Oauth2Credentials[] */
    this.credentialsSource = undefined;
    this.persistCache = false;
    this.selectedSecurity = 0;

    /**
     * @type string
     */
    this.baseUri = undefined;
    /**
     * @type string
     */
    this.version = undefined;
    /**
     * @type string[]
     */
    this.protocols = undefined;

    this.urlFactory = new ApiUrlDataModel();

    /** 
     * Set when the selection change, this is a JS object created form the 
     * supportedOperation definition of the AMF graph.
     * @type {ApiOperation}
     */
    this[operationValue] = undefined;
    /** 
     * The list of security list items to render.
     * An operation may have multiple security definition in an or/and fashion.
     * This allows to render the selector to pick the current security.
     * @type {SecuritySelectorListItem[]} 
     */
    this[securityList] = undefined;
    /** @type boolean */
    this.applyAuthorization = undefined;
    /** @type boolean */
    this.globalCache = undefined;
    /** @type string */
    this.mimeType = undefined;
    /** @type ApiEndPoint */
    this[endpointValue] = undefined;

    // for the AmfParameterMixin
    this.target = this;
  }

  // for the AmfParameterMixin
  notifyChange() {  }

  _attachListeners(node) {
    node.addEventListener('api-response', this._responseHandler);
    node.addEventListener('oauth2-redirect-uri-changed', this._authRedirectChangedHandler);
    node.addEventListener('populate-annotated-fields', this._populateAnnotatedFieldsHandler);
  }

  _detachListeners(node) {
    node.removeEventListener('api-response', this._responseHandler);
    node.removeEventListener('oauth2-redirect-uri-changed', this._authRedirectChangedHandler);
    node.removeEventListener('populate-annotated-fields', this._populateAnnotatedFieldsHandler);
  }

  /**
   * Overrides `AmfHelperMixin.__amfChanged`.
   * It updates selection and clears cache in the model generator, per APIC-229
   * @param {any} amf 
   */
  __amfChanged(amf) {
    const { urlFactory } = this;
    if (urlFactory) {
      if (!this.persistCache) {
        urlFactory.clearCache();
      }
      urlFactory.amf = amf;
      this.readUrlData();
    }
    this._selectedChanged();
    this._updateServers();
  }

  /**
   * Reads the URL data from the ApiUrlDataModel library and sets local variables.
   */
  readUrlData() {
    const { effectiveBaseUri, selected, server, protocols, version, urlFactory } = this;
    if (!urlFactory) {
      return;
    }
    if (protocols) {
      urlFactory.protocols = protocols;
    }
    if (protocols) {
      urlFactory.version = version;
    }

    const result = urlFactory.getModel({
      apiUri: effectiveBaseUri,
      selected,
      server,
    });
    this._apiBaseUri = result.apiBaseUri;
    this._endpointUri = result.endpointPath;
    this._pathModel = result.pathModel;
    this._queryModel = result.queryModel;
    this[updateServerParameters]()
  }

  /**
   * Checks if the current server has variables and update the parameters array
   */
  async [updateServerParameters]() {
    const { server } = this;
    const source = 'server';
    // clears previously set request parameters related to server configuration.
    this.parametersValue = this.parametersValue.filter(item => item.source !== source);
    if (!server) {
      return;
    }
    const factory = new AmfSerializer(this.amf);
    const model = factory.server(server);
    if (Array.isArray(model.variables) && model.variables.length) {
      model.variables.forEach((param) => {
        const item = /** @type OperationParameter */ ({
          binding: param.binding,
          paramId: param.id,
          parameter: param,
          source,
        });
        if (param.schema) {
          item.schema = param.schema;
          item.schemaId = param.schema.id;
        }
        this.parametersValue.push(item);
      });
    }
  }

  /**
   * Checks if the current endpoint has variables and requests them when needed.
   */
  async [updateEndpointParameters]() {
    const source = 'endpoint';
    // clears previously set request parameters related to server configuration.
    this.parametersValue = this.parametersValue.filter(item => item.source !== source);
    const endpoint = this[endpointValue];
    if (!endpoint) {
      return;
    }
    if (Array.isArray(endpoint.parameters) && endpoint.parameters.length) {
      endpoint.parameters.forEach((param) => {
        const item = /** @type OperationParameter */ ({
          binding: param.binding,
          paramId: param.id,
          parameter: param,
          source,
        });
        if (param.schema) {
          item.schema = param.schema;
          item.schemaId = param.schema.id;
        }
        this.parametersValue.push(item);
      });
    }
  }

  /**
   * Dispatches bubbling and composed custom event.
   * By default the event is cancelable until `cancelable` property is set to false.
   * @param {string} type Event type
   * @param {any=} detail A detail to set
   * @param {boolean=} cancelable When false the event is not cancelable.
   * @returns {CustomEvent}
   */
  _dispatch(type, detail, cancelable=true) {
    const e = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      cancelable,
      detail
    });
    this.dispatchEvent(e);
    return e;
  }

  reset() {
    this[securityList] = undefined;
    this.mimeType = undefined;
    this.parametersValue = /** @type {OperationParameter[]} */ ([]);
  }

  _selectedChanged() {
    const { amf, selected } = this;
    if (!amf || !selected) {
      this.reset();
      return;
    }
    const model = this._computeMethodAmfModel(amf, selected);
    if (!model) {
      this.reset();
      return;
    }
    const factory = new AmfSerializer(amf);
    const operation = factory.operation(model);
    this[operationValue] = operation;
    this[processEndpoint]();
    this[processOperation]();
    this[processSecurity]();
    this._apiHeaders = this. _computeHeaders(model);
    this._apiPayload = this._computeApiPayload(model);
  }

  /**
   * Searches for the current operation endpoint and sets variables from the endpoint definition.
   */
  [processEndpoint]() {
    const operation = this[operationValue];
    const wa = this._computeWebApi(this.amf);
    const model = this._computeMethodEndpoint(wa, operation.id);
    const factory = new AmfSerializer(this.amf);
    const endpoint = factory.endPoint(model);
    this[endpointValue] = endpoint;
    this[updateEndpointParameters]();
  }

  /**
   * Collects operations input parameters into a single object.
   */
  [processOperation]() {
    const source = 'request';
    const operation = this[operationValue];
    // clears previously set request parameters (query, path, headers)
    this.parametersValue = this.parametersValue.filter(item => item.source !== source);
    const { request } = operation;
    if (!request) {
      return;
    }
    this[appendToParams](request.queryParameters, source);
    this[appendToParams](request.headers, source);
    this[appendToParams](request.cookieParameters, source);
  }

  /**
   * Processes security information for the UI.
   */
  [processSecurity]() {
    const operation = this[operationValue];
    const { security } = operation;
    this[securityList] = SecurityProcessor.readSecurityList(security);
    this.selectedSecurity = 0;
  }

  /**
   * Appends a list of parameters to the list of rendered parameters
   * @param {ApiParameter[]} list
   * @param {string} source
   */
  [appendToParams](list, source) {
    const params = this.parametersValue;
    if (Array.isArray(list)) {
      list.forEach((param) => {
        params.push({
          paramId: param.id,
          parameter: param,
          binding: param.binding,
          source,
          schema: param.schema,
          schemaId: param.schema && param.schema.id ? param.schema.id : undefined,
        });
      });
    }
  }

  /**
   * A handler for the change event dispatched by the `raw` editor.
   * @param {Event} e
   */
  [rawBodyChangeHandler](e) {
    const editor = /** @type BodyRawEditorElement */ (e.target);
    const { value, dataset } = editor;
    const { payloadId } = dataset;
    if (!payloadId) {
      return;
    }
    cachePayloadValue(payloadId, value);
  }

  /**
   * A handler for the change event dispatched by the 
   * `urlEncode` editor.
   * Updated the local value, model, and notifies the change.
   * @param {Event} e
   */
  [modelBodyEditorChangeHandler](e) {
    const editor = /** @type BodyFormdataEditorElement */ (e.target);
    const { value, model, dataset } = editor;
    const { payloadId } = dataset;
    if (!payloadId) {
      return;
    }
    cachePayloadValue(payloadId, value, model);
  }

  /**
   * @param {Event} e
   */
  [authSelectorHandler](e) {
    const list = /** @type AnypointListbox */ (e.target);
    const { selected } = list;
    this.selectedSecurity = Number(selected);
    this.requestUpdate();
  }

  _computeMethodAmfModel(model, selected) {
    if (!model || !selected) {
      return undefined;
    }
    let api = model;
    if (Array.isArray(api)) {
      [api] = api;
    }
    if (this._hasType(api, this.ns.aml.vocabularies.document.Document)) {
      const webApi = this._computeWebApi(api);
      return this._computeMethodModel(webApi, selected);
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.supportedOperation);
    const methods = this._ensureArray(api[key]);
    if (!methods) {
      return undefined;
    }
    return methods.find((item) => item['@id'] === selected);
  }

  /**
   * Computes model definition for headers.
   *
   * @param {any} model Method model
   * @return {any[]|undefined} List of headers or undefined.
   */
  _computeHeaders(model) {
    if (!model) {
      return undefined;
    }
    const expects = this._computeExpects(model);
    if (!expects) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.header);
    let headers = expects[key];
    if (headers && !(headers instanceof Array)) {
      headers = [headers];
    }
    return headers;
  }

  /**
   * Computes value for `apiPayload` property from AMF model for current
   * method.
   *
   * @param {any} model Operation model.
   * @return {any[]|undefined} Method payload.
   */
  _computeApiPayload(model) {
    if (!model) {
      return undefined;
    }
    const expects = this._computeExpects(model);
    if (!expects) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.payload);
    let payload = expects[key];
    if (payload && !Array.isArray(payload)) {
      payload = [payload];
    }
    return payload;
  }

  /**
   * Handles send button click.
   * Depending on authorization validity it either sends the
   * request or forces authorization and sends the request.
   */
  _sendHandler() {
    this.execute();
  }

  /**
   * To be called when the user want to execute the request but
   * authorization is invalid (missing values).
   * This function brings the auth panel to front and displays error toast
   *
   * TODO: There is a case when the user didn't requested OAuth2 token
   * but provided all the data. This function should check for this
   * condition and call authorization function automatically.
   */
  async authAndExecute() {
    const panel = this.shadowRoot.querySelector('api-authorization-editor');
    if (panel) {
      await panel.authorize();
      const valid = panel.validate();
      if (valid) {
        this.execute();
      }
    }
  }

  /**
   * Executes the request by dispatching `api-request` custom event.
   * The event must be handled by hosting application to ensure transport.
   * Use `advanced-rest-client/xhr-simple-request` component to add logic
   * that uses XHR as a transport.
   *
   * Hosting application also must reset state of `loadingRequest` property
   * once the response is ready. It also can dispatch `api-response`
   * custom event handled by this element to reset state. This is also
   * handled by `xhr-simple-request` component.
   */
  execute() {
    this._loadingRequest = true;
    const request = this.serialize();
    const uuid = v4();
    this._requestId = uuid;
    request.id = uuid;
    this._dispatch('api-request', request);
    TelemetryEvents.event(this, {
      category: EventCategory,
      action: 'request-execute',
      label: 'true'
    });
  }

  /**
   * Sends the `abort-api-request` custom event to cancel the request.
   * Calling this method before sending request may have unexpected
   * behavior because `requestId` is only set with `execute()` method.
   */
  abort() {
    this._dispatch('abort-api-request', {
      url: this.url,
      id: this.requestId
    });
    TelemetryEvents.event(this, {
      category: EventCategory,
      action: 'request-abort',
      label: 'true'
    });
    this._loadingRequest = false;
    this._requestId = undefined;
  }

  /**
   * Event handler for abort click.
   */
  _abortRequest() {
    this.abort();
  }

  /**
   * Returns an object with the request properties.
   * The object contains:
   * - `method` (String)
   * - `url` (String)
   * - `headers` (String)
   * - `payload` (String)
   * - `auth` (Object[])
   *
   * The `auth` property is optional and is only added to the request if
   * simple `authorization` header will not work. For example NTLM auth
   * method has to be made on a single socket connection (authorization
   * and the request) so it can't be made before the request.
   *
   * The `auth` object contains 2 properties:
   * - `type` (String) the authorization type - one of from the
   * `auth-methods` element
   * - `settings` (Object) Authorization parameters entered by the user.
   * It vary and depends on selected auth method.
   * For example in case of the NTLM it will be: `username`, `password` and
   * `domain`. See `advanced-rest-client/auth-methods` for model descriptions.
   *
   * @return {ApiConsoleRequest}
   */
  serialize() {
    const op = this[operationValue];
    if (!op) {
      throw new Error(`No API is operation defined on the editor`);
    }
    const method = (op.method || 'get').toUpperCase();
    const params = this.parametersValue.map(item => item.parameter);
    const report = AmfInputParser.reportRequestInputs(params, InputCache.getStore(this, this.globalCache), this.nilValues);
    const serverUrl = `${this._apiBaseUri}${this._endpointUri}`;
    let url = applyUrlVariables(serverUrl, report.path, true);
    url = applyUrlParameters(url, report.query, true);
    const headers = generateHeaders(report.header);
    const request = /** @type ApiConsoleRequest */ ({
      method,
      url,
      headers,
    });

    if (!['GET', 'HEAD'].includes(method)) {
      /** @type any */
      let body;
      const { payload } = this;
      if (payload) {
        const info = readCachePayloadValue(payload.id);
        if (info && info.value) {
          body = info.value;
        }
      }
      if (body instanceof FormData) {
        request.headers = /** @type string */ (HeadersParser.replace(request.headers, 'content-type', null));
      } else if (payload) {
        request.headers = ensureContentType(request.headers, payload.mediaType);
      }
      if (typeof body !== 'undefined') {
        request.payload = body;
      }
    }
    const authElement = this.shadowRoot.querySelector('api-authorization-editor');
    if (authElement) {
      const auth = authElement.serialize();
      request.authorization = auth;
      if (this.applyAuthorization) {
        SecurityProcessor.applyAuthorization(request, auth);
      }
    }
    return request;
  }

  /**
   * Handler for the `api-response` custom event.
   * Clears the loading state.
   *
   * @param {CustomEvent} e
   */
  _responseHandler(e) {
    if (!e.detail || (e.detail.id !== this.requestId)) {
      return;
    }
    this._loadingRequest = false;
  }

  /**
   * Handler for the `oauth2-redirect-uri-changed` custom event. Changes
   * the `redirectUri` property.
   * @param {CustomEvent} e
   */
  _authRedirectChangedHandler(e) {
    this.redirectUri = e.detail.value;
  }

  /**
   * Handle event for populating annotated fields in the editor.
   * @param {CustomEvent} e 
   */
  _populateAnnotatedFieldsHandler(e) {
    const { values } = e.detail;
    this._updateAnnotatedQueryParameters(values);
    this._updateAnnotatedHeaders(values);
    /** @TODO */
    // this._updateAnnotatedSecuritySchemeFields(values);
  }

  /**
   * Given an array of PopulationInfo objects, look for query parameters
   * annotated with the matching information, and update their values
   * in the component's view model.
   * @param {PopulationInfo[]} populationInfoArray 
   */
  _updateAnnotatedQueryParameters(populationInfoArray) {
    const method = this._computeMethodAmfModel(this.amf, this.selected);
    if (!method) {
      return;
    }
    const expects = this._computeExpects(method)
    const queryParameters = this._computeQueryParameters(expects);
    if (!queryParameters) {
      return;
    }
    this._updateAnnotatedFields(populationInfoArray, queryParameters, this._updateQueryModelParameter.bind(this));
  }

  /**
   * Given an array of PopulationInfo objects, look for headers
   * annotated with the matching information, and update their values
   * in the component's view model.
   * @param {PopulationInfo[]} populationInfoArray 
   */
  _updateAnnotatedHeaders(populationInfoArray) {
    const headers = this._apiHeaders;
    this._updateAnnotatedFields(populationInfoArray, headers, this._updateHeader.bind(this));
  }

  /**
   * Generic function for updating the nodes whose custom property information matches
   * with the `populationInfoArray` objects provided. To update, it calls the `updateCallbackFn`
   * which is one of the function's arguments.
   * @param {PopulationInfo[]} populationInfoArray 
   * @param {Object[]} parameterNodes AMF parameter nodes
   * @param {Function} updateCallbackFn Function to call to update a node's editor value
   */
  _updateAnnotatedFields(populationInfoArray, parameterNodes, updateCallbackFn) {
    if (!parameterNodes || !updateCallbackFn || !populationInfoArray) {
      return;
    }
    populationInfoArray.forEach(({ annotationName, annotationValue, fieldValue }) => {
      parameterNodes
        .filter(node => this._computeHasCustomPropertyValue(node, annotationName, annotationValue))
        .forEach(node => updateCallbackFn(node, fieldValue));
    });
  }

  /**
   * Returns all of the custom domain properties for an AMF node
   * @param {Object} shape AMF node
   * @return {Object[]} Array of all custom domain property nodes
   */
  _computeCustomProperties(shape) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.document.customDomainProperties);
    const ids = (this._getValueArray(shape, key) || []).map(result => {
      if (Array.isArray(result)) {
        // eslint-disable-next-line no-param-reassign
        [result] = result;
      }
      if (typeof result === 'string') {
        return result
      }
      return /** @type string */ (this._getValue(/** @type object */ (result), '@id'));
    });
    return ids.map(id => {
      const propertyKey = id.startsWith('amf://id') ? id : `amf://id${id}`;
      return shape[propertyKey];
    });
  }

  /**
   * Function to determine whether a shape has a custom domain property whose name
   * and value match with the provided information.
   * @param {Object} shape AMF node
   * @param {string} propertyName Custom domain property name to search for
   * @param {string} propertyValue Custom domain property value to match with
   * @return {boolean}
   */
  _computeHasCustomPropertyValue(shape, propertyName, propertyValue) {
    if (Array.isArray(shape)) {
      // eslint-disable-next-line no-param-reassign
      [shape] = shape;
    }
    if (!shape) {
      return false;
    }
    const properties = this._computeCustomProperties(shape) || [];
    const nameKey = this._getAmfKey(this.ns.aml.vocabularies.core.extensionName);
    const valueKey = this._getAmfKey(this.ns.aml.vocabularies.data.value);
    return Boolean(properties.find(property => {
      const actualPropName = this._getValue(property, nameKey);
      const actualPropValue = this._getValue(property, valueKey);
      return actualPropName === propertyName && actualPropValue === propertyValue;
    }));
  }

  /**
   * Given a query parameter AMF node, update the parameter's representation
   * in this component's view model with the given value.
   * @param {Object} queryParamNode AMF node for query parameter
   * @param {*} value The new value for the query parameter field
   */
  _updateQueryModelParameter(queryParamNode, value) {
    const nameKey = this._getAmfKey(this.ns.aml.vocabularies.core.name);
    const name = this._getValue(queryParamNode, nameKey);
    const queryParamItem = this._queryModel.find(item => item.name === name);
    if (queryParamItem) {
      queryParamItem.value = value;
    }
  }

  /**
   * Given a header AMF node, update the header's representation in
   * this component's `_headers` property. To do this, first transform
   * the `_headers` string to a JSON, then change the value, then
   * set the new string for the `_headers` property.
   * @param {Object} headerNode AMF node for header
   * @param {*} value The new value for the header field
   */
  _updateHeader(headerNode, value) {
    const nameKey = this._getAmfKey(this.ns.aml.vocabularies.core.name);
    const name = this._getValue(headerNode, nameKey);
    const headers = HeadersParser.stringToJSON(this._headers);
    const headerItem = headers.find(header => header.name === name);
    headerItem.value = value;
    // We can't call the HeadersParser.toString() method because it removes the empty headers
    this._headers = headers.map(header => HeadersParser.itemToString(header)).join('\n');
  }

  _urlHandler(e) {
    this.url = e.target.value;
  }

  _pathModelHandler(e) {
    this._pathModel = [...e.target.pathModel];
  }

  _queryModelHandler(e) {
    this._queryModel = [...e.target.queryModel];
  }

  _headersHandler(e) {
    const { value } = e.target;
    this._headers = value;
    this._headerContentType = HeadersParser.contentType(value);
  }

  _bodyContentTypeHandler(e) {
    this._bodyContentType = e.detail.value;
    this._headers = HeadersParser.replace(this._headers, 'content-type', e.detail.value);
  }

  /**
   * Computes a current server value for selection made in the server selector.
   */
  _updateServer() {
    const { serverValue, serverType } = this;
    if (serverType !== 'server') {
      this.server = undefined;
    } else {
      this.server = this._findServerByValue(serverValue);
    }
  }

  /**
   * @param {string} value Server's base URI
   * @return {any|undefined} An element associated with the base URI or
   * undefined if not found.
   */
  _findServerByValue(value) {
    const { servers = [] } = this;
    return servers.find((server) => this._getServerUri(server) === value);
  }

  /**
   * @param {any} server Server definition.
   * @return {string|undefined} Value for server's base URI
   */
  _getServerUri(server) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    return /** @type string */ (this._getValue(server, key));
  }

  /**
   * Updates the list of servers for current operation so a server for current
   * selection can be computed.
   */
  _updateServers() {
    const webApi = this._computeWebApi(this.amf);
    const methodId = this.selected;
    const endpoint = this._computeMethodEndpoint(webApi, methodId);
    const endpointId = endpoint ? endpoint['@id'] : '';
    this.servers = this._getServers({ endpointId, methodId });
  }

  /**
   * Handler for the change dispatched from the server selector.
   * @param {CustomEvent} e
   */
  _serverCountHandler(e) {
    const { value } = e.detail;
    this.serversCount = value;
  }

  /**
   * Handler for the change dispatched from the server selector.
   * @param {CustomEvent} e
   */
  _serverHandler(e) {
    const { value, type } = e.detail;
    this.serverType = type;
    this.serverValue = value;
  }

  /**
   * @param {Event} e
   */
  [mediaTypeSelectHandler](e) {
    const select = /** @type AnypointRadioGroupElement */ (e.target);
    const { selected } = select;
    const mime = String(selected);
    this.mimeType = mime;
  }

  /**
   * Given a headers string, if it does not contain a Content-Type header,
   * set it manually and return the computed headers string.
   * @param {String} headersString 
   * @return {String} headers string with content type if not already present
   */
  _ensureContentTypeInHeaders(headersString) {
    const headersArray = HeadersParser.toJSON(headersString);
    const hasContentTypeHeader = headersArray.find((value) => value.name.toLowerCase() === 'content-type');
    if (!hasContentTypeHeader && this.mimeType) {
      headersArray.push({ name: 'content-type', value: this.mimeType, enabled: true });
      return HeadersParser.toString(headersArray);
    }
    return HeadersParser.toString(headersString);
  }

  render() {
    const { styles } = this;
    return html`<style>${styles}</style>
    <div class="content">
      ${this._serverSelectorTemplate()}
      ${this._urlEditorTemplate()}
      ${this._urlLabelTemplate()}
      ${this[parametersTemplate]()}
      ${this[headersTemplate]()}
      ${this[mediaTypeSelectorTemplate]()}
      ${this[bodyTemplate]()}
      ${this[authorizationTemplate]()}
      ${this._formActionsTemplate()}
    </div>`;
  }

  _urlEditorTemplate() {
    const {
      noUrlEditor,
      _apiBaseUri,
      _endpointUri,
      _queryModel,
      _pathModel,
      eventsTarget,
      readOnly,
      disabled,
      outlined,
      compatibility,
    } = this;
    return html`
    <div class="url-editor" ?hidden="${noUrlEditor}">
      <api-url-editor
        @change="${this._urlHandler}"
        @pathmodelchange="${this._pathModelHandler}"
        @querymodelchange="${this._queryModelHandler}"
        ?required="${!noUrlEditor}"
        .baseUri="${_apiBaseUri}"
        .endpointPath="${_endpointUri}"
        .queryModel="${_queryModel}"
        .pathModel="${_pathModel}"
        .eventsTarget="${eventsTarget}"
        .readOnly="${readOnly}"
        .disabled="${disabled}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
      ></api-url-editor>
    </div>`;
  }

  /**
   * @return {TemplateResult|string} Template for the request URL label.
   */
  _urlLabelTemplate() {
    const { urlLabel, url } = this;
    if (!urlLabel) {
      return '';
    }
    return html`<div class="url-label" title="Current request URL">${url}</div>`;
  }

  [authorizationTemplate]() {
    const { security } = this;
    if (!security) {
      return '';
    }
    const { selectedSecurity = 0, amf, compatibility, redirectUri, credentialsSource, globalCache } = this;
    const rendered = security[selectedSecurity];
    return html`
    <section class="authorization params-section">
      ${security.length > 1 ? this[authorizationSelectorTemplate](security, selectedSecurity) : ''}
      <api-authorization-editor 
        .amf="${amf}"
        .security="${rendered.security}"
        .compatibility="${compatibility}"
        .oauth2RedirectUri="${redirectUri}"
        .credentialsSource="${credentialsSource}"
        ?globalCache="${globalCache}"></api-authorization-editor>
    </section>
    `;
  }

  /**
   * @param {SecuritySelectorListItem[]} security
   * @param {number} selected
   * @returns {TemplateResult} The template for the security drop down selector.
   */
  [authorizationSelectorTemplate](security, selected) {
    const { compatibility } = this;
    return html`
    <anypoint-dropdown-menu
      name="selected"
      .compatibility="${compatibility}"
      class="auth-selector"
    >
      <label slot="label">Authorization method</label>
      <anypoint-listbox slot="dropdown-content"
        .selected="${selected}"
        @selected-changed="${this[authSelectorHandler]}"
        .compatibility="${compatibility}"
        attrForItemTitle="data-label"
      >
        ${security.map((item) => this[authorizationSelectorItemTemplate](item))}
      </anypoint-listbox>
    </anypoint-dropdown-menu>
    `;
  }

  /**
   * @param {SecuritySelectorListItem} info
   * @returns {TemplateResult} The template for the security drop down selector list item.
   */
  [authorizationSelectorItemTemplate](info) {
    const { labels, types } = info;
    const label = labels.join(', ');
    const type = types.join(', ');
    const single = !type;
    return html`
    <anypoint-item
      .compatibility="${this.compatibility}"
      data-label="${label}"
    >
      <anypoint-item-body ?twoline="${!single}">
        <div>${label}</div>
        ${!single ? html`<div data-secondary>${type}</div>` : ''}
      </anypoint-item-body>
    </anypoint-item>
    `;
  }

  _formActionsTemplate() {
    const { _loadingRequest } = this;
    return html`
    <div class="action-bar">
      ${_loadingRequest ? this._abortButtonTemplate() : this._sendButtonTemplate()}
      <progress ?hidden="${!_loadingRequest}"></progress>
    </div>`;
  }

  /**
   * Creates a template for the "abort" button.
   *
   * @return {TemplateResult}
   */
  _abortButtonTemplate() {
    const {
      compatibility,
    } = this;
    return html`
    <anypoint-button
      class="send-button abort"
      emphasis="high"
      ?compatibility="${compatibility}"
      @click="${this._abortRequest}"
    >Abort</anypoint-button>`;
  }

  /**
   * Creates a template for the "send" or "auth and send" button.
   *
   * @return {TemplateResult}
   */
  _sendButtonTemplate() {
    const {
      compatibility,
    } = this;
    return html`
    <anypoint-button
      class="send-button"
      emphasis="high"
      ?compatibility="${compatibility}"
      @click="${this._sendHandler}"
    >Send</anypoint-button>`;
  }

  /**
   * @return {TemplateResult} A template for the server selector
   */
  _serverSelectorTemplate() {
    const {
      amf,
      serverType,
      serverValue,
      allowCustomBaseUri,
      outlined,
      compatibility,
      _serverSelectorHidden,
      selected,
    } = this;
    return html`
    <api-server-selector
      ?hidden="${_serverSelectorHidden}"
      ?allowCustom="${allowCustomBaseUri}"
      .amf="${amf}"
      .value="${serverValue}"
      .type="${serverType}"
      .selectedShape="${selected}"
      selectedShapeType="method"
      autoSelect
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      @serverscountchanged="${this._serverCountHandler}"
      @apiserverchanged="${this._serverHandler}"
    >
      <slot name="custom-base-uri" slot="custom-base-uri"></slot>
    </api-server-selector>`;
  }

  [parametersTemplate]() {
    /** @type OperationParameter[] */
    const qp = [];
    /** @type OperationParameter[] */
    const path = [];
    this.parametersValue.forEach((item) => {
      if (item.binding === 'query') {
        qp.push(item)
      } else if (item.binding === 'path') {
        path.push(item);
      }
    });
    if (!qp.length && !path.length) {
      return '';
    }
    const pathOptions = Object.freeze({ required: true });
    return html`
    <section class="params-section">
      <div class="section-title"><span class="label">Parameters</span></div>
      ${path.map(param => this.parameterTemplate(param, pathOptions))}
      ${qp.map(param => this.parameterTemplate(param))}
    </section>
    `;
  }

  [headersTemplate]() {
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
   * @return {TemplateResult|string} The template for the payload's mime type selector.
   */
  [mediaTypeSelectorTemplate]() {
    const { payloads, mimeType } = this;
    if (!payloads || payloads.length === 1) {
      return '';
    }
    const mimes = payloads.map(p => p.mediaType);
    let index = mimes.indexOf(mimeType);
    if (index === -1) {
      index = 0;
    }

    return html`
    <div class="payload-mime-selector">
      <label>Payload media type</label>
      <anypoint-radio-group 
        @selected="${this[mediaTypeSelectHandler]}" 
        .selected="${index}"
        attrForSelected="data-value" 
      >
        ${mimes.map((item) => html`<anypoint-radio-button name="mediaTypeValue" data-value="${item}">${item}</anypoint-radio-button>`)}
      </anypoint-radio-group>
    </div>
    `;
  }

  /**
   * @returns {TemplateResult|string} The template for the body editor. 
   */
  [bodyTemplate]() {
    const { payload } = this;
    if (!payload) {
      return '';
    }
    const mimeType = payload.mediaType;
    const info = getPayloadValue(payload);
    if (mimeType === 'application/x-www-form-urlencoded') {
      return this[formDataEditorTemplate](info, payload.id);
    }
    if (mimeType === 'multipart/form-data') {
      return this[multipartEditorTemplate](info, payload.id);
    }
    return this[rawEditorTemplate](info, payload.id, mimeType);
  }

  /**
   * @param {any} info
   * @param {string} id
   * @returns {TemplateResult} The template for the editor that specializes in the URL encoded form data
   */
  [formDataEditorTemplate](info, id) {
    const editorModel = /** @type ApiType[] */ (info.model);
    const effectiveValue = Array.isArray(editorModel) && editorModel.length ? undefined : info.value;
    return html`
    <body-formdata-editor 
      autoEncode
      .value="${ifProperty(effectiveValue)}"
      .model="${ifProperty(editorModel)}"
      data-payload-id="${id}"
      @change="${this[modelBodyEditorChangeHandler]}"
    ></body-formdata-editor>
    `;
  }

  /**
   * @param {any} info
   * @param {string} id
   * @returns {TemplateResult} The template for the editor that specializes in the multipart form data
   */
  [multipartEditorTemplate](info, id) {
    const editorModel = /** @type ApiType[] */ (info.model);
    const effectiveValue = Array.isArray(editorModel) && editorModel.length ? undefined : info.value;
    return html`
    <body-multipart-editor 
      .value="${ifProperty(effectiveValue)}"
      .model="${ifProperty(editorModel)}"
      ignoreContentType
      data-payload-id="${id}"
      @change="${this[modelBodyEditorChangeHandler]}"
    ></body-multipart-editor>
    `;
  }

  /**
   * @param {any} info
   * @param {string} id
   * @param {string} mimeType
   * @returns {TemplateResult} The template for the editor that specializes in any text data
   */
  [rawEditorTemplate](info, id, mimeType) {
    let schemas;
    if (Array.isArray(info.schemas) && info.schemas.length) {
      schemas = info.schemas;
    }
    return html`
    <body-raw-editor 
      .value="${info.value}" 
      .contentType="${mimeType}"
      .schemas="${ifProperty(schemas)}"
      data-payload-id="${id}"
      @change="${this[rawBodyChangeHandler]}"
    ></body-raw-editor>
    `;
  }
}
