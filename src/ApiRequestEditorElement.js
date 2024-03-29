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
import { AmfHelperMixin } from '@api-components/amf-helper-mixin';
import { apiFormStyles } from '@api-components/api-forms';
import { ApiUrlDataModel } from '@api-components/api-url';
import { TelemetryEvents } from '@advanced-rest-client/arc-events';
import { v4 } from '@advanced-rest-client/uuid-generator';
import { UrlParser } from '@advanced-rest-client/arc-url';
import { HeadersParser } from '@advanced-rest-client/arc-headers';
import '@api-components/api-url/api-url-editor.js';
import '@api-components/api-url/api-url-params-editor.js';
import '@api-components/api-authorization/api-authorization.js';
import '@api-components/api-headers/api-headers-editor.js';
import '@api-components/api-body-editor/api-body-editor.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/oauth-authorization/oauth2-authorization.js';
import '@advanced-rest-client/oauth-authorization/oauth1-authorization.js';
import '@api-components/api-server-selector/api-server-selector.js';
import elementStyles from './styles/Editor.styles.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.FormItem} FormItem */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.ArcBaseRequest} ArcBaseRequest */
/** @typedef {import('@api-components/api-authorization/src/ApiAuthorization').ApiAuthorization} ApiAuthorization */
/** @typedef {import('@api-components/api-authorization/src/types').ApiAuthorizationSettings} ApiAuthorizationSettings */
/** @typedef {import('@api-components/api-authorization/src/types').AuthorizationParams} AuthorizationParams */
/** @typedef {import('@api-components/amf-helper-mixin').DomainElement} DomainElement */
/** @typedef {import('./types').ApiConsoleRequest} ApiConsoleRequest */
/** @typedef {import('./types').PopulationInfo} PopulationInfo */

export const EventCategory = 'API Request editor';

export class ApiRequestEditorElement extends AmfHelperMixin(
  EventsTargetMixin(LitElement)
) {
  get styles() {
    return [apiFormStyles, elementStyles];
  }

  static get properties() {
    return {
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
       * Computed from AMF model for the method HTTP method name.
       */
      _httpMethod: { type: String },
      /**
       * Headers for the request.
       */
      _headers: { type: String },
      /**
       * Body for the request. The type of the body depends on
       * defined in the API media type.
       */
      _payload: { type: String },
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
       * Computed value of security scheme from selected method.
       */
      _securedBy: { type: Array },
      /**
       * Computed list of headers in the AMF model
       */
      _apiHeaders: { type: Array },
      /**
       * Defined by the API payload data.
       */
      _apiPayload: { type: Array },
      /**
       * Computed value if the method can carry a payload.
       */
      _isPayloadRequest: { type: Boolean },
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
      persistCache: { type: Boolean }
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
    this.dispatchEvent(
      new CustomEvent(`api-request-panel-selection-changed`, {
        composed: true,
        detail: {
          value: this.selected,
        },
      })
    );
  }

  get httpMethod() {
    return this._httpMethod;
  }

  get headers() {
    return this._headers;
  }

  get payload() {
    return this._payload;
  }

  get contentType() {
    return this._headerContentType || this._bodyContentType;
  }

  get securedBy() {
    return this._securedBy;
  }

  get apiHeaders() {
    return this._apiHeaders;
  }

  get apiPayload() {
    return this._apiPayload;
  }

  get isPayloadRequest() {
    return this._isPayloadRequest;
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
    this._baseUri = this._ensureUrlScheme(value);
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
   * @return {ApiAuthorization} A reference to the authorization panel, if exists
   */
  get _auth() {
    return /** @type {ApiAuthorization} */ (this.shadowRoot.querySelector(
      'api-authorization'
    ));
  }

  get customQueryModel() {
    return (this._queryModel || []).filter((query) => query.schema.isCustom);
  }

  /**
   * @constructor
   */
  constructor() {
    super();
    this._responseHandler = this._responseHandler.bind(this);
    this._authRedirectChangedHandler = this._authRedirectChangedHandler.bind(
      this
    );
    this._populateAnnotatedFieldsHandler = this._populateAnnotatedFieldsHandler.bind(
      this
    );

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
    this.credentialsSource = [];
    this.persistCache = false;

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
  }

  _attachListeners(node) {
    node.addEventListener('api-response', this._responseHandler);
    node.addEventListener(
      'oauth2-redirect-uri-changed',
      this._authRedirectChangedHandler
    );
    node.addEventListener(
      'populate_annotated_fields',
      this._populateAnnotatedFieldsHandler
    );
  }

  _detachListeners(node) {
    node.removeEventListener('api-response', this._responseHandler);
    node.removeEventListener(
      'oauth2-redirect-uri-changed',
      this._authRedirectChangedHandler
    );
    node.removeEventListener(
      'populate_annotated_fields',
      this._populateAnnotatedFieldsHandler
    );
  }

  /**
   * Overrides `AmfHelperMixin.__amfChanged`.
   * It updates selection and clears cache in the model generator, per APIC-229
   * @param {any} amf
   */
  __amfChanged(amf) {
    const { urlFactory } = this;
    let  operationChanged = undefined;
    if (urlFactory.amf) {
       operationChanged = urlFactory.operation
    }
    if (urlFactory) {
      if (!this.persistCache) {
        urlFactory.clearCache();
      }
      urlFactory.amf = amf;
      this.readUrlData();
    }
    this._selectedChanged(operationChanged);
    this._updateServers();
  }

  /**
   * Reads the URL data from the ApiUrlDataModel library and sets local variables.
   */
  readUrlData() {
    const {
      effectiveBaseUri,
      selected,
      server,
      protocols,
      version,
      urlFactory,
      customQueryModel
    } = this;
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
      server
    });
    this._apiBaseUri = result.apiBaseUri;
    this._endpointUri = result.endpointPath;
    this._pathModel = result.pathModel;
    this._queryModel = result.queryModel.concat(customQueryModel);
  }

  /**
   * Dispatches bubbling and composed custom event.
   * By default the event is cancelable until `cancelable` property is set to false.
   * @param {string} type Event type
   * @param {any=} detail A detail to set
   * @param {boolean=} cancelable When false the event is not cancelable.
   * @returns {CustomEvent}
   */
  _dispatch(type, detail, cancelable = true) {
    const e = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      cancelable,
      detail
    });
    this.dispatchEvent(e);
    return e;
  }

  /**
   * Clears the request properties.
   */
  clearRequest() {
    this.url = '';
    this._headers = '';
    this._headerContentType = '';
    this._bodyContentType = '';
    this._payload = '';
    this.dispatchEvent(new CustomEvent('requestclearstate'));
    TelemetryEvents.event(this, {
      category: EventCategory,
      action: 'Clear request'
    });
  }

  /**
   * This function is called when the AMF model change and the element needs to update
   * Given the current selection, it updates the selected operation
   *
   * To find the selected, this method searches the lexical value of the
   * operation changed value and then searches this in the new AMF model.
   *
   * When not found operation return previous selection.
   * @param {AMF} amf
   * @param {object} operationChanged
   * @return {string} The new selected operation
   * @example '#14'
   **/
  _computeSelected(amf, operationChanged) {
    if (operationChanged && amf && amf[0]) {
      // get required keys
      const opKey = this._getAmfKey(
        this.ns.aml.vocabularies.apiContract.supportedOperation
      );
      const lexicalKey = this._getAmfKey(
        this.ns.aml.vocabularies.docSourceMaps.lexical
      );
      const lexicalValueKey = this._getAmfKey(
        this.ns.aml.vocabularies.docSourceMaps.value
      );
      const sourceKey = this._getAmfKey(
        this.ns.aml.vocabularies.docSourceMaps.sources
      );

      // search the lexical value of the operation changed
      const sourcesOld = this._getValueArray(operationChanged, sourceKey);
      const lexicalsOld = this._getValueArray(sourcesOld[0], lexicalKey);
      const lexicalValueOld = this._getValue(lexicalsOld[0], lexicalValueKey);

      // get enpoints from the new AMF model
      const encodes = this._computeEncodes(amf);
      const endpoints = this._computeEndpoints(encodes);

      let newOperationSelected = null;

      // loop throught a list of endpoints and find the operation with the same lexical value
      for (const endpoint of endpoints) {
        const supportedOperation = this._ensureArray(endpoint[opKey]);
        // if the operation is not supported by the endpoint, skip it
        if (!supportedOperation) {
          newOperationSelected = undefined;
        }
        // if the operation is supported by the endpoint, find the operation with the same lexical value
        else {
          newOperationSelected = supportedOperation.find((operation) => {
            const sources = this._getValueArray(operation, sourceKey);
            const lexicals = this._getValueArray(sources[0], lexicalKey);
            const lexicalValue = this._getValue(lexicals[0], lexicalValueKey);
            return lexicalValue === lexicalValueOld;
          });
        }
        // if the operation is found, break the loop
        if (newOperationSelected) {
          break;
        }
      };
      // if the operation is not found, return the previous selection
      if (!newOperationSelected) {
        return this.selected;
      }
      // if the operation is found, return the new selection
      return newOperationSelected["@id"];
    }
  }


  _selectedChanged(operationChanged) {
    this.clearRequest()
    const { amf, selected } = this;
    if (operationChanged) {
      this.selected = this._computeSelected(amf, operationChanged);
    }
    if (!amf || !selected) {
      return;
    }
    const model = this._computeMethodAmfModel(amf, selected);
    if (!model) {
      return;
    }
    this._authSettings = undefined;
    const method = /** @type string */ (this._getValue(
      model,
      this.ns.aml.vocabularies.apiContract.method
    ));
    this._httpMethod = method;
    this._isPayloadRequest = this._computeIsPayloadRequest(method);
    this._securedBy = this._computeSecuredBy(model);
    this._apiHeaders = this._computeHeaders(model);
    this._apiPayload = this._computeApiPayload(model);
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
    const key = this._getAmfKey(
      this.ns.aml.vocabularies.apiContract.supportedOperation
    );
    const methods = this._ensureArray(api[key]);
    if (!methods) {
      return undefined;
    }
    return methods.find((item) => item['@id'] === selected);
  }

  /**
   * Computes AMF model for authorization panel.
   *
   * @param {any} model Current method model.
   * @return {any[]|undefined} List of security definitions for the endpoint.
   */
  _computeSecuredBy(model) {
    if (!model) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.security.security);
    let data = model[key];
    if (data && !Array.isArray(data)) {
      data = [data];
    }
    return data;
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
   * Computes value for `isPayloadRequest`.
   * Only `GET` and `HEAD` methods are known as ones that can't carry a
   * payload. For any other HTTP method this always returns true.
   *
   * @param {String} method HTTP method value
   * @return {Boolean}
   */
  _computeIsPayloadRequest(method) {
    return ['get', 'head'].indexOf(method) === -1;
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
    this.__requestAuthAwaiting = true;
    const panel = this._auth;
    let result;
    if (panel) {
      result = await panel.forceAuthorization(false);
    }
    if (!result) {
      // const toast = this.shadowRoot.querySelector('#authFormError');
      // toast.opened = true;
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
    const request = this.serializeRequest();
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
  serializeRequest() {
    const method = (this.httpMethod || 'get').toUpperCase();
    const result = /** @type ApiConsoleRequest */ ({
      method,
      url: this.url,
      headers: this._ensureContentTypeInHeaders(this.headers) || '',
      startTime: Date.now()
    });

    if (['GET', 'HEAD'].indexOf(result.method) === -1) {
      const payload = this._payload;
      if (payload instanceof FormData) {
        const contentType = HeadersParser.contentType(result.headers);
        // According to form data documentation: do not explicitly set the Content-Type header on the request. Doing so will prevent
        // the browser from being able to set the Content-Type header with the boundary expression it will use to delimit form fields in the request body.
        if (contentType && contentType.startsWith('multipart/')) {
          result.headers = /** @type string */ (HeadersParser.replace(
            result.headers,
            'content-type',
            null
          ));
        }
      }
      result.payload = this._payload;
    }

    if (this._securedBy) {
      const node = this._auth;
      const { settings = [] } = node;
      if (settings.length) {
        const params = node.createAuthParams();
        this._applyAuthorization(result, settings, params);
        const oa1 = this.shadowRoot.querySelector('oauth1-authorization');
        oa1.signRequest(result, settings);
      }
    }
    return result;
  }

  /**
   * A function that applies authorization parameters to the request object.
   *
   * @param {ApiConsoleRequest} request The request object
   * @param {ApiAuthorizationSettings[]} settings The authorization settings from the auth panel
   * @param {AuthorizationParams} authParams A parameters to apply to the request
   */
  _applyAuthorization(request, settings, authParams) {
    request.auth = settings;
    const { headers, params } = authParams;
    this._applyCookies(request);
    this._applyQueryParams(request, params);
    this._applyHeaders(request, headers);
  }

  /**
   * Method to apply document cookies if the request has cookies.
   * @param {ApiConsoleRequest} request The request object
   */
  _applyCookies(request) {
    if (request?.auth && request?.auth?.length) {
      request.withCredentials = true;
      for (let i = 0; i < request?.auth?.length; i += 1) {
        if (request.auth[i]?.config?.cookies) {
          document.cookie = this._getCookies(request.auth[i]);
        }
      }
    }
  }

  /**
   * Method to get string cookies in format key=value; key2=value2
   */
  _getCookies(auth) {
    const cookies = Object.entries(auth?.config?.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');

    return `${cookies}; path=/`;
  }

  /**
   * Applies a map of query parameters to the request object.
   * @param {ApiConsoleRequest} request The request object
   * @param {Record<string, string>} params A map of query parameters to apply to the request
   */
  _applyQueryParams(request, params) {
    const keys = Object.keys(params);
    if (!keys.length) {
      return;
    }
    const parser = new UrlParser(request.url);
    const sParams = parser.searchParams;
    keys.forEach((name) => {
      const value = params[name];
      const index = sParams.findIndex((item) => item[0] === name);
      if (index !== -1) {
        sParams.splice(index, 1);
      }
      sParams.push([name, value]);
    });
    parser.searchParams = sParams;
    request.url = parser.toString();
  }

  /**
   * Applies a map of headers to the request object.
   * @param {ApiConsoleRequest} request The request object
   * @param {Record<string, string>} headers A map of headers to apply to the request
   */
  _applyHeaders(request, headers) {
    const keys = Object.keys(headers);
    if (!keys.length) {
      return;
    }
    if (request.headers === undefined) {
      request.headers = '';
    }
    const list = HeadersParser.toJSON(request.headers);
    keys.forEach((name) => {
      const value = headers[name];
      const index = list.findIndex((item) => item.name === name);
      if (index !== -1) {
        list.splice(index, 1);
      }
      list.push({ name, value });
    });
    request.headers = HeadersParser.toString(list);
  }

  /**
   * Handler for the `api-response` custom event.
   * Clears the loading state.
   *
   * @param {CustomEvent} e
   */
  _responseHandler(e) {
    if (!e.detail || e.detail.id !== this.requestId) {
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
    const expects = this._computeExpects(method);
    const queryParameters = this._computeQueryParameters(expects);
    if (!queryParameters) {
      return;
    }
    this._updateAnnotatedFields(
      populationInfoArray,
      queryParameters,
      this._updateQueryModelParameter.bind(this)
    );
  }

  /**
   * Given an array of PopulationInfo objects, look for headers
   * annotated with the matching information, and update their values
   * in the component's view model.
   * @param {PopulationInfo[]} populationInfoArray
   */
  _updateAnnotatedHeaders(populationInfoArray) {
    const headers = this._apiHeaders;
    this._updateAnnotatedFields(
      populationInfoArray,
      headers,
      this._updateHeader.bind(this)
    );
    // this.shadowRoot.querySelector('api-headers-editor').value = this._headers
  }

  /**
   * Generic function for updating the nodes whose custom property information matches
   * with the `populationInfoArray` objects provided. To update, it calls the `updateCallbackFn`
   * which is one of the function's arguments.
   * @param {PopulationInfo[]} populationInfoArray
   * @param {Object[]} parameterNodes AMF parameter nodes
   * @param {Function} updateCallbackFn Function to call to update a node's editor value
   */
  _updateAnnotatedFields(
    populationInfoArray,
    parameterNodes,
    updateCallbackFn
  ) {
    if (!parameterNodes || !updateCallbackFn || !populationInfoArray) {
      return;
    }
    populationInfoArray.forEach(
      ({ annotationName, annotationValue, fieldValue }) => {
        parameterNodes
          .filter((node) =>
            this._computeHasCustomPropertyValue(
              node,
              annotationName,
              annotationValue
            )
          )
          .forEach((node) => updateCallbackFn(node, fieldValue));
      }
    );
  }

  /**
   * Returns all of the custom domain properties for an AMF node
   * @param {DomainElement} shape AMF node
   * @return {{name: string, value: string}[]} Array of all custom domain property nodes
   */
  _computeCustomPropertiesNamesAndValues(shape) {
    const customPropKey = this._getAmfKey(
      this.ns.aml.vocabularies.document.customDomainProperties
    );
    const nameKey = this._getAmfKey(
      this.ns.aml.vocabularies.core.extensionName
    );
    const valueKey = this._getAmfKey(this.ns.aml.vocabularies.data.value);
    const idPrefix = this._getAmfKey('amf://id');
    const properties = this._getValueArray(shape, customPropKey) || [];
    return /** @type {{name: string, value: string}[]} */ (properties.map(
      (property) => {
        const prop = Array.isArray(property) ? property[0] : property;
        if (
          !prop ||
          typeof prop === 'string' ||
          typeof prop === 'number' ||
          typeof prop === 'boolean'
        ) {
          return null;
        }
        const id = /** @type string */ (this._getValue(prop, '@id'));
        let propertyKey = id.startsWith(idPrefix) ? id : `${idPrefix}:${id}`;
        let shapeElement = shape[propertyKey];
        if (Array.isArray(shapeElement)) {
          [shapeElement] = shapeElement;
        }
        if (!shapeElement) {
          propertyKey = id.startsWith('amf://id') ? id : `amf://id${id}`;
          shapeElement = shape[propertyKey];
        }
        if (Array.isArray(shapeElement)) {
          [shapeElement] = shapeElement;
        }
        if (!shapeElement) {
          return null;
        }
        const name =
          this._getValue(prop, nameKey) ||
          this._getValue(shapeElement, nameKey);
        const value = this._getValue(shapeElement, valueKey);
        return { name, value };
      }
    ));
  }

  /**
   * Function to determine whether a shape has a custom domain property whose name
   * and value match with the provided information.
   * @param {DomainElement} domainElement AMF node
   * @param {string} propertyName Custom domain property name to search for
   * @param {string} propertyValue Custom domain property value to match with
   * @return {boolean}
   */
  _computeHasCustomPropertyValue(domainElement, propertyName, propertyValue) {
    const shape = Array.isArray(domainElement)
      ? domainElement[0]
      : domainElement;
    if (!shape) {
      return false;
    }
    const tuples = this._computeCustomPropertiesNamesAndValues(shape) || [];
    return Boolean(
      tuples.find(
        (tuple) => tuple.name === propertyName && tuple.value === propertyValue
      )
    );
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
    const newQueryModel = [...this._queryModel];
    const queryParamItem = newQueryModel.find((item) => item.name === name);
    if (queryParamItem) {
      queryParamItem.value = value;
      this._queryModel = newQueryModel;
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
    const headerItem = headers.find((header) => header.name === name);
    if (headerItem) {
      headerItem.value = value;
      // We can't call the HeadersParser.toString() method because it removes the empty headers
      this._headers = headers
        .map((header) => HeadersParser.itemToString(header))
        .join('\n');
    }
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

  _payloadHandler(e) {
    this._payload = e.detail.value;
  }

  _bodyContentTypeHandler(e) {
    this._bodyContentType = e.detail.value;
    this._headers = HeadersParser.replace(
      this._headers,
      'content-type',
      e.detail.value
    );
  }

  _authChanged(e) {
    const valid = e.target.validate();
    if (valid && this.__requestAuthAwaiting) {
      this.__requestAuthAwaiting = false;
      this.execute();
    }
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
   * Given a headers string, if it does not contain a Content-Type header,
   * set it manually and return the computed headers string.
   * @param {String} headersString
   * @return {String} headers string with content type if not already present
   */
  _ensureContentTypeInHeaders(headersString) {
    const headersArray = HeadersParser.toJSON(headersString);
    const hasContentTypeHeader = headersArray.find(
      (value) => value.name.toLowerCase() === 'content-type'
    );
    if (!hasContentTypeHeader && this.contentType) {
      headersArray.push({
        name: 'content-type',
        value: this.contentType,
        enabled: true
      });
      return HeadersParser.toString(headersArray);
    }
    return HeadersParser.toString(headersString);
  }

  render() {
    const { styles } = this;
    return html`<style>
        ${styles}
      </style>
      ${this._oauthHandlersTemplate()}
      <div class="content">
        ${this._serverSelectorTemplate()} ${this._urlEditorTemplate()}
        ${this._urlLabelTemplate()} ${this._paramsEditorTemplate()}
        ${this._headersEditorTemplate()} ${this._bodyEditorTemplate()}
        ${this._authTemplate()} ${this._formActionsTemplate()}
      </div>`;
  }

  _oauthHandlersTemplate() {
    const { eventsTarget } = this;
    return html` <oauth2-authorization
        .eventsTarget="${eventsTarget}"
      ></oauth2-authorization>
      <oauth1-authorization
        .eventsTarget="${eventsTarget}"
        ignoreBeforeRequest
      ></oauth1-authorization>`;
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
      compatibility
    } = this;
    return html` <div class="url-editor" ?hidden="${noUrlEditor}">
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
    return html`<div class="url-label" title="Current request URL">
      ${url}
    </div>`;
  }

  _paramsEditorTemplate() {
    const {
      _queryModel,
      _pathModel,
      allowCustom,
      readOnly,
      disabled,
      outlined,
      compatibility,
      allowDisableParams,
      allowHideOptional
    } = this;
    return html` <div class="editor-section">
      <api-url-params-editor
        class="params-editor"
        @pathmodelchange="${this._pathModelHandler}"
        @querymodelchange="${this._queryModelHandler}"
        .pathModel="${_pathModel}"
        .queryModel="${_queryModel}"
        ?allowCustom="${allowCustom}"
        .readOnly="${readOnly}"
        .disabled="${disabled}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?allowDisableParams="${allowDisableParams}"
        ?allowHideOptional="${allowHideOptional}"
      ></api-url-params-editor>
    </div>`;
  }

  _headersEditorTemplate() {
    const {
      _apiHeaders,
      eventsTarget,
      amf,
      allowCustom,
      readOnly,
      disabled,
      outlined,
      compatibility,
      allowDisableParams,
      allowHideOptional,
      _headers
    } = this;
    return html` <div
      class="editor-section"
      ?hidden="${!_apiHeaders && !allowCustom}"
    >
      <div role="heading" aria-level="2" class="section-title">Headers</div>
      <api-headers-editor
        @change="${this._headersHandler}"
        .eventsTarget="${eventsTarget}"
        .amf="${amf}"
        .amfHeaders="${_apiHeaders}"
        .readOnly="${readOnly || disabled}"
        .value="${_headers}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        ?allowCustom="${allowCustom}"
        ?allowDisableParams="${allowDisableParams}"
        ?allowHideOptional="${allowHideOptional}"
      ></api-headers-editor>
    </div>`;
  }

  _bodyEditorTemplate() {
    if (!this._isPayloadRequest || !this._apiPayload) {
      return '';
    }
    const {
      _apiPayload,
      eventsTarget,
      amf,
      allowCustom,
      readOnly,
      disabled,
      outlined,
      compatibility,
      contentType,
      allowDisableParams,
      allowHideOptional
    } = this;

    return html`<div class="editor-section">
      <div role="heading" aria-level="2" class="section-title">Body</div>
      <api-body-editor
        @value-changed="${this._payloadHandler}"
        @content-type-changed="${this._bodyContentTypeHandler}"
        .eventsTarget="${eventsTarget}"
        .amf="${amf}"
        .amfBody="${_apiPayload}"
        .readOnly="${readOnly}"
        .disabled="${disabled}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        .contentType="${contentType}"
        ?allowCustom="${allowCustom}"
        ?allowDisableParams="${allowDisableParams}"
        ?allowHideOptional="${allowHideOptional}"
        lineNumbers
      ></api-body-editor>
    </div>`;
  }

  _authTemplate() {
    if (!this._securedBy) {
      return '';
    }
    const {
      amf,
      redirectUri,
      readOnly,
      disabled,
      outlined,
      compatibility,
      _securedBy,
      credentialsSource
    } = this;
    return html`<div class="editor-section">
      <div role="heading" aria-level="2" class="section-title">Credentials</div>
      <api-authorization
        .amf="${amf}"
        .security="${_securedBy}"
        .redirectUri="${redirectUri}"
        ?readOnly="${readOnly}"
        ?disabled="${disabled}"
        ?outlined="${outlined}"
        ?compatibility="${compatibility}"
        .credentialsSource="${credentialsSource}"
        @change=${this._authChanged}
      ></api-authorization>
    </div>`;
  }

  _formActionsTemplate() {
    const { _loadingRequest } = this;
    return html` <div class="action-bar">
      ${_loadingRequest
        ? this._abortButtonTemplate()
        : this._sendButtonTemplate()}
      <progress ?hidden="${!_loadingRequest}"></progress>
    </div>`;
  }

  /**
   * Creates a template for the "abort" button.
   *
   * @return {TemplateResult}
   */
  _abortButtonTemplate() {
    const { compatibility } = this;
    return html` <anypoint-button
      class="send-button abort"
      emphasis="high"
      ?compatibility="${compatibility}"
      @click="${this._abortRequest}"
      >Abort</anypoint-button
    >`;
  }

  /**
   * Creates a template for the "send" or "auth and send" button.
   *
   * @return {TemplateResult}
   */
  _sendButtonTemplate() {
    const { compatibility } = this;
    return html` <anypoint-button
      class="send-button"
      emphasis="high"
      ?compatibility="${compatibility}"
      @click="${this._sendHandler}"
      >Send</anypoint-button
    >`;
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
      selected
    } = this;
    return html` <api-server-selector
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
}
