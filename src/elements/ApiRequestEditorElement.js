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
import { classMap } from 'lit-html/directives/class-map.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { AmfHelperMixin, AmfSerializer } from '@api-components/amf-helper-mixin';
import { TelemetryEvents } from '@advanced-rest-client/arc-events';
import { v4 } from '@advanced-rest-client/uuid-generator';
import { HeadersParser } from '@advanced-rest-client/arc-headers'
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
import '@anypoint-web-components/anypoint-switch/anypoint-switch.js';
import { ifProperty } from "@advanced-rest-client/body-editor";
import elementStyles from '../styles/Editor.styles.js';
import { ensureContentType, generateHeaders } from "../lib/Utils.js";
import { cachePayloadValue, getPayloadValue, readCachePayloadValue } from "../lib/PayloadUtils.js";
import { applyUrlParameters, applyUrlVariables, computeEndpointUrlValue } from '../lib/UrlUtils.js';
import { SecurityProcessor } from '../lib/SecurityProcessor.js';
import { AmfParameterMixin } from '../lib/AmfParameterMixin.js';
import { AmfInputParser } from '../lib/AmfInputParser.js';
import * as InputCache from '../lib/InputCache.js';
import { RequestEvents } from '../events/RequestEvents.js';
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
/** @typedef {import('@api-components/amf-helper-mixin').ApiServer} ApiServer */
/** @typedef {import('@api-components/amf-helper-mixin').Operation} Operation */
/** @typedef {import('@anypoint-web-components/anypoint-listbox').AnypointListbox} AnypointListbox */
/** @typedef {import('@anypoint-web-components/anypoint-radio-button/index').AnypointRadioGroupElement} AnypointRadioGroupElement */
/** @typedef {import('../elements/ApiAuthorizationEditorElement').default} ApiAuthorizationEditorElement */
/** @typedef {import('../types').ApiConsoleRequest} ApiConsoleRequest */
/** @typedef {import('../types').PopulationInfo} PopulationInfo */
/** @typedef {import('../types').SecuritySelectorListItem} SecuritySelectorListItem */
/** @typedef {import('../types').OperationParameter} OperationParameter */

export const EventCategory = 'API Request editor';

export const domainIdValue = Symbol('domainIdValue');
export const operationValue = Symbol('currentModel');
export const endpointValue = Symbol('endpointValue');
export const serializerValue = Symbol('serializerValue');
export const loadingRequestValue = Symbol('loadingRequestValue');
export const requestIdValue = Symbol('requestIdValue');
export const baseUriValue = Symbol('baseUriValue');
export const serverLocalValue = Symbol('serverLocalValue');
export const processOperation = Symbol('processOperation');
export const processEndpoint = Symbol('processEndpoint');
export const processSecurity = Symbol('processSecurity');
export const processServers = Symbol('processServers');
export const appendToParams = Symbol('appendToParams');
export const securityList = Symbol('securityList');
export const updateServer = Symbol('updateServer');
export const updateServerParameters = Symbol('updateServerParameters');
export const updateEndpointParameters = Symbol('updateEndpointParameters');
export const computeMethodAmfModel = Symbol('computeMethodAmfModel');
export const computeUrlValue = Symbol('computeUrlValue');
export const processSelection = Symbol('processSelection');
export const authSelectorHandler = Symbol('authSelectorHandler');
export const mediaTypeSelectHandler = Symbol('mediaTypeSelectHandler');
export const modelBodyEditorChangeHandler = Symbol('modelBodyEditorChangeHandler');
export const rawBodyChangeHandler = Symbol('rawBodyChangeHandler');
export const serverCountHandler = Symbol('serverCountHandler');
export const serverHandler = Symbol('serverHandler');
export const populateAnnotatedFieldsHandler = Symbol('populateAnnotatedFieldsHandler');
export const authRedirectChangedHandler = Symbol('authRedirectChangedHandler');
export const responseHandler = Symbol('responseHandler');
export const sendHandler = Symbol('sendHandler');
export const abortHandler = Symbol('abortHandler');
export const optionalToggleHandler = Symbol('optionalToggleHandler');
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
export const serverSelectorTemplate = Symbol('serverSelectorTemplate');
export const toggleOptionalTemplate = Symbol('toggleOptionalTemplate');
export const urlLabelTemplate = Symbol('urlLabelTemplate');
export const formActionsTemplate = Symbol('formActionsTemplate');
export const abortButtonTemplate = Symbol('abortButtonTemplate');
export const sendButtonTemplate = Symbol('sendButtonTemplate');

export class ApiRequestEditorElement extends AmfParameterMixin(AmfHelperMixin(EventsTargetMixin(LitElement))) {
  get styles() {
    return [
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
       * When set it renders a label with the computed URL.
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
       * Enables compatibility with Anypoint styling
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * OAuth2 redirect URI.
       * This value **must** be set in order for OAuth 1/2 to work properly.
       */
      redirectUri: { type: String },
      /**
       * Final request URL including settings like `baseUri`, AMF
       * model settings and user provided parameters.
       */
      url: { type: String },
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

  /**
   * @returns {string} The domain id (AMF id) of the rendered operation.
   */
  get selected() {
    return this[domainIdValue];
  }

  /**
   * @param {string} value The domain id (AMF id) of the rendered operation.
   */
  set selected(value) {
    const old = this[domainIdValue];
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this[domainIdValue] = value;
    this.requestUpdate('selected', old);
    this[processSelection]();
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

  /**
   * @returns {boolean}
   */
  get loadingRequest() {
    return this[loadingRequestValue];
  }

  /**
   * @returns {string}
   */
  get requestId() {
    return this[requestIdValue];
  }

  /**
   * @returns {string}
   */
  get baseUri() {
    return this[baseUriValue];
  }

  /**
   * @param {string} value
   */
  set baseUri(value) {
    const old = this[baseUriValue];
    if (old === value) {
      return;
    }
    this[baseUriValue] = value;
    this.readUrlData();
    this.requestUpdate('baseUri', old);
  }

  /**
   * @returns {ApiServer}
   */
  get server() {
    return this[serverLocalValue];
  }

  /**
   * This is the final computed value for the baseUri to propagate downwards
   * If baseUri is defined, return baseUri
   * Else, return the selectedServerValue if serverType is not `server`
   * @returns {string}
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
  get serverSelectorHidden() {
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
    this[responseHandler] = this[responseHandler].bind(this);
    this[authRedirectChangedHandler] = this[authRedirectChangedHandler].bind(this);
    this[populateAnnotatedFieldsHandler] = this[populateAnnotatedFieldsHandler].bind(this);

    this.urlLabel = false;
    this.outlined = false;
    this.compatibility = false;
    this.noServerSelector = false;
    this.allowCustom = false;
    this.allowDisableParams = false;
    this.allowHideOptional = false;
    this.allowCustomBaseUri = false;
    /** @type Oauth2Credentials[] */
    this.credentialsSource = undefined;
    this.selectedSecurity = 0;

    /** @type string */
    this.url = undefined;
    /** @type string */
    this.baseUri = undefined;
    /** 
     * Set when the selection change, this is a JS object created form the 
     * supportedOperation definition of the AMF graph.
     * @type {ApiOperation}
     */
    this[operationValue] = undefined;
    /** @type ApiEndPoint */
    this[endpointValue] = undefined;
    /** 
     * The list of security list items to render.
     * An operation may have multiple security definition in an or/and fashion.
     * This allows to render the selector to pick the current security.
     * @type {SecuritySelectorListItem[]} 
     */
    this[securityList] = undefined;
    /** @type ApiServer[] */
    this.servers = undefined;
    /** @type ApiServer */
    this[serverLocalValue] = undefined;
    /** @type boolean */
    this.applyAuthorization = undefined;
    /** @type boolean */
    this.globalCache = undefined;
    /** @type string */
    this.mimeType = undefined;
    /** @type AmfSerializer */
    this[serializerValue] = new AmfSerializer();

    // for the AmfParameterMixin
    this.target = this;
    /**
     * Flag set when the request is being made.
     * @type {boolean}
     */
    this[loadingRequestValue] = undefined;
    /**
     * Generated request ID when the request is sent. This value is reported
     * in send and abort events
     * @type {string}
     */
    this[requestIdValue] = undefined;
    /** 
     * The list of parameter groups that are opened when `allowHideOptional` is set.
     * @type {string[]}
     */
    this.openedOptional = [];
  }

  // for the AmfParameterMixin
  notifyChange() {  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    node.addEventListener('api-response', this[responseHandler]);
    node.addEventListener('oauth2-redirect-uri-changed', this[authRedirectChangedHandler]);
    node.addEventListener('populate-annotated-fields', this[populateAnnotatedFieldsHandler]);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    node.removeEventListener('api-response', this[responseHandler]);
    node.removeEventListener('oauth2-redirect-uri-changed', this[authRedirectChangedHandler]);
    node.removeEventListener('populate-annotated-fields', this[populateAnnotatedFieldsHandler]);
  }

  /**
   * Overrides `AmfHelperMixin.__amfChanged`.
   * It updates selection and clears cache in the model generator, per APIC-229
   * @param {any} amf 
   */
  __amfChanged(amf) {
    this[serializerValue].amf = amf;
    this[processServers]();
    this[processSelection]();
    this.readUrlData();
  }

  /**
   * Reads the URL data from the ApiUrlDataModel library and sets local variables.
   */
  readUrlData() {
    this[computeUrlValue]();
    this[updateServerParameters]();
  }

  /**
   * A function to be overwritten by child classes to execute an action when a parameter has changed.
   * @param {string} key
   */
  paramChanged(key) {
    this[computeUrlValue]();
    const param = this.parametersValue.find(p => p.paramId === key);
    if (param && param.binding === 'header' && (param.parameter.name || '').toLocaleLowerCase() === 'content-type') {
      const value = InputCache.get(this, param.paramId, this.globalCache);
      this.mimeType = value;
    }
  }

  /**
   * Computes the URL value for the current serves, selected server, and endpoint's path.
   */
  [computeUrlValue]() {
    const { effectiveBaseUri, server } = this;
    let result;
    if (effectiveBaseUri) {
      result = effectiveBaseUri;
    } else {
      result = computeEndpointUrlValue(this[endpointValue], server);
    }
    const params = this.parametersValue.map(item => item.parameter);
    const report = AmfInputParser.reportRequestInputs(params, InputCache.getStore(this, this.globalCache), this.nilValues);
    let url = applyUrlVariables(result, report.path, true);
    url = applyUrlParameters(url, report.query, true);
    this.url = url;
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
    if (Array.isArray(server.variables) && server.variables.length) {
      server.variables.forEach((param) => {
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

  reset() {
    this[securityList] = undefined;
    this.mimeType = undefined;
    this.parametersValue = /** @type {OperationParameter[]} */ ([]);
  }

  [processSelection]() {
    const { amf, selected } = this;
    if (!amf || !selected) {
      this.reset();
      return;
    }
    const model = this[computeMethodAmfModel](amf, selected);
    if (!model) {
      this.reset();
      return;
    }
    const operation = this[serializerValue].operation(model);
    this[operationValue] = operation;
    this[processEndpoint]();
    this[processOperation]();
    this[processSecurity]();
    this[processServers]();
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

  //
  // Servers section (computing the list of servers, state change handles, etc.)
  //

  /**
   * Computes the list of servers to be rendered by this operation.
   * This should be called after the `[processEndpoint]()` function, when the 
   * endpoint model is set.
   */
  [processServers]() {
    const { selected: methodId } = this;
    const endpoint = this[endpointValue];
    const endpointId = endpoint ? endpoint.id : '';
    const servers = this._getServers({ endpointId, methodId });
    if (Array.isArray(servers)) {
      this.servers = servers.map(s => this[serializerValue].server(s));
    } else {
      this.servers = undefined;
    }
  }

  /**
   * @param {any} model
   * @param {string} selected
   * @returns {Operation|undefined} AMF graph model for an operation
   */
  [computeMethodAmfModel](model, selected) {
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
   * Handles send button click.
   * Depending on authorization validity it either sends the
   * request or forces authorization and sends the request.
   */
  [sendHandler]() {
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
    this[loadingRequestValue] = true;
    const request = this.serialize();
    const uuid = v4();
    this[requestIdValue] = uuid;
    request.id = uuid;
    RequestEvents.apiRequest(this, request);
    RequestEvents.apiRequestLegacy(this, request);
    TelemetryEvents.event(this, {
      category: EventCategory,
      action: 'request-execute',
      label: 'true'
    });
    this.requestUpdate();
  }

  /**
   * Sends the `abort-api-request` custom event to cancel the request.
   * Calling this method before sending request may have unexpected
   * behavior because `requestId` is only set with `execute()` method.
   */
  abort() {
    const detail = {
      url: this.url,
      id: this.requestId,
    };
    RequestEvents.abortApiRequest(this, detail);
    RequestEvents.abortApiRequestLegacy(this, detail);
    TelemetryEvents.event(this, {
      category: EventCategory,
      action: 'request-abort',
      label: 'true'
    });
    this[loadingRequestValue] = false;
    this[requestIdValue] = undefined;
    this.requestUpdate();
  }

  /**
   * Event handler for abort click.
   */
  [abortHandler]() {
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
    const serverUrl = `${this.url}`;
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
  [responseHandler](e) {
    if (!e.detail || (e.detail.id !== this.requestId)) {
      return;
    }
    this[loadingRequestValue] = false;
    this.requestUpdate();
  }

  /**
   * Handler for the `oauth2-redirect-uri-changed` custom event. Changes
   * the `redirectUri` property.
   * @param {CustomEvent} e
   */
  [authRedirectChangedHandler](e) {
    this.redirectUri = e.detail.value;
  }

  /**
   * Handle event for populating annotated fields in the editor.
   * @param {CustomEvent} e 
   */
  [populateAnnotatedFieldsHandler](e) {
    const populationInfoArray = /** @type PopulationInfo[] */ (e.detail.values);
    const { parametersValue=[] } = this;
    const allAnnotated = parametersValue.filter(param => Array.isArray(param.parameter.customDomainProperties) && !!param.parameter.customDomainProperties.length);
    let update = false;
    populationInfoArray.forEach(({ annotationName, annotationValue, fieldValue }) => {
      allAnnotated.forEach((item) => {
        const { parameter, paramId } = item;
        const hasAnnotation = parameter.customDomainProperties.some((property) => property.extensionName === annotationName && /** @type any */ (property).value === annotationValue);
        if (!hasAnnotation) {
          return;
        }
        InputCache.set(this, paramId, fieldValue, this.globalCache);
        update = true;
      });
    });
    if (update) {
      this.requestUpdate();
    }
    /* @TODO populate values for the security schema. */
  }

  /**
   * Computes a current server value for selection made in the server selector.
   */
  [updateServer]() {
    const { serverValue, serverType, servers=[] } = this;
    if (serverType !== 'server') {
      this[serverLocalValue] = /** @type ApiServer */ (undefined);
    } else {
      this[serverLocalValue] = servers.find(server => server.url === serverValue);
    }
    this.readUrlData();
  }

  /**
   * Handler for the change dispatched from the server selector.
   * @param {CustomEvent} e
   */
  [serverCountHandler](e) {
    const { value } = e.detail;
    this.serversCount = value;
    this[updateServer]();
  }

  /**
   * Handler for the change dispatched from the server selector.
   * @param {CustomEvent} e
   */
  [serverHandler](e) {
    const { value, type } = e.detail;
    this.serverType = type;
    this.serverValue = value;
    this[updateServer]();
    this.readUrlData();
  }

  /**
   * @param {Event} e
   */
  [mediaTypeSelectHandler](e) {
    const select = /** @type AnypointRadioGroupElement */ (e.target);
    const { selected } = select;
    const mime = String(selected);
    this.mimeType = mime;
    const ctParam = this.parametersValue.find(p => p.binding === 'header' && (p.parameter.name || '').toLocaleLowerCase() === 'content-type');
    if (ctParam) {
      InputCache.set(this, ctParam.paramId, mime, this.globalCache);
    }
  }

  /**
   * Toggles optional parameter groups.
   * @param {Event} e
   */
  [optionalToggleHandler](e) {
    const node = /** @type HTMLElement */ (e.target);
    const { target } = node.dataset;
    if (!target) {
      return;
    }
    if (!Array.isArray(this.openedOptional)) {
      this.openedOptional = [];
    }
    if (this.openedOptional.includes(target)) {
      const index = this.openedOptional.indexOf(target);
      this.openedOptional.splice(index, 1);
    } else {
      this.openedOptional.push(target);
    }
    this.requestUpdate();
  }

  render() {
    const { styles } = this;
    return html`<style>${styles}</style>
    <div class="content">
      ${this[serverSelectorTemplate]()}
      ${this[urlLabelTemplate]()}
      ${this[parametersTemplate]()}
      ${this[headersTemplate]()}
      ${this[mediaTypeSelectorTemplate]()}
      ${this[bodyTemplate]()}
      ${this[authorizationTemplate]()}
      ${this[formActionsTemplate]()}
    </div>`;
  }

  /**
   * @return {TemplateResult|string} Template for the request URL label.
   */
  [urlLabelTemplate]() {
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
    const { selectedSecurity = 0, amf, compatibility, outlined, redirectUri, credentialsSource, globalCache } = this;
    const rendered = security[selectedSecurity];
    return html`
    <section class="authorization params-section">
      <div class="section-title"><span class="label">Authorization</span></div>
      ${security.length > 1 ? this[authorizationSelectorTemplate](security, selectedSecurity) : ''}
      <api-authorization-editor 
        .amf="${amf}"
        .security="${rendered.security}"
        .compatibility="${compatibility}"
        .outlined="${outlined}"
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

  [formActionsTemplate]() {
    const loading = this[loadingRequestValue];
    return html`
    <div class="action-bar">
      ${loading ? this[abortButtonTemplate]() : this[sendButtonTemplate]()}
      <progress ?hidden="${!loading}"></progress>
    </div>`;
  }

  /**
   * Creates a template for the "abort" button.
   *
   * @return {TemplateResult}
   */
  [abortButtonTemplate]() {
    const {
      compatibility,
    } = this;
    return html`
    <anypoint-button
      class="send-button abort"
      emphasis="high"
      ?compatibility="${compatibility}"
      @click="${this[abortHandler]}"
    >Abort</anypoint-button>`;
  }

  /**
   * Creates a template for the "send" or "auth and send" button.
   *
   * @return {TemplateResult}
   */
  [sendButtonTemplate]() {
    const {
      compatibility,
    } = this;
    return html`
    <anypoint-button
      class="send-button"
      emphasis="high"
      ?compatibility="${compatibility}"
      @click="${this[sendHandler]}"
    >Send</anypoint-button>`;
  }

  /**
   * @return {TemplateResult} A template for the server selector
   */
  [serverSelectorTemplate]() {
    const {
      amf,
      serverType,
      serverValue,
      allowCustomBaseUri,
      outlined,
      compatibility,
      serverSelectorHidden,
      selected,
    } = this;
    return html`
    <api-server-selector
      ?hidden="${serverSelectorHidden}"
      ?allowCustom="${allowCustomBaseUri}"
      .amf="${amf}"
      .value="${serverValue}"
      .type="${serverType}"
      .selectedShape="${selected}"
      selectedShapeType="method"
      autoSelect
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      @serverscountchanged="${this[serverCountHandler]}"
      @apiserverchanged="${this[serverHandler]}"
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
    const { openedOptional=[] } = this;
    const pathOptions = Object.freeze({ required: true });
    const queryClasses = {
      'query-params': true,
      'hide-optional': this.allowHideOptional && !openedOptional.includes('query'),
    };
    return html`
    <section class="params-section">
      <div class="section-title"><span class="label">Parameters</span></div>
      <div class="path-params">
        ${path.map(param => this.parameterTemplate(param, pathOptions))}
      </div>
      <div class="${classMap(queryClasses)}">
        ${this[toggleOptionalTemplate]('query', qp)}
        ${qp.map(param => this.parameterTemplate(param))}
      </div>
    </section>
    `;
  }

  [headersTemplate]() {
    const headers = this.parametersValue.filter(item => item.binding === 'header');
    if (!headers.length) {
      return '';
    }
    const { openedOptional=[] } = this;
    const classes = {
      'header-params': true,
      'hide-optional': this.allowHideOptional && !openedOptional.includes('header'),
    };
    return html`
    <section class="params-section">
      <div class="section-title"><span class="label">Headers</span></div>
      ${this[toggleOptionalTemplate]('header', headers)}
      <div class="${classMap(classes)}">
        ${headers.map(param => this.parameterTemplate(param))}
      </div>
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

  /**
   * @param {string} target The name of the target parameter group.
   * @param {OperationParameter[]} params The list of parameters. When all are required or empty it won't render then button.
   * @returns {TemplateResult|string} Template for the switch button to toggle visibility of the optional items.
   */
  [toggleOptionalTemplate](target, params) {
    const { openedOptional=[], allowHideOptional } = this;
    if (!allowHideOptional || !params || !params.length) {
      return '';
    }
    const optional = params.some(p => !p.parameter.required);
    if (!optional) {
      return '';
    }
    const checked = openedOptional.includes(target);
    return html`
    <div class="optional-checkbox">
      <anypoint-switch
        class="toggle-optional-switch"
        .checked="${checked}"
        @change="${this[optionalToggleHandler]}"
        title="Toggles optional parameters"
        data-target="${target}"
      >Show optional parameters</anypoint-switch>
    </div>
    `;
  }
}
