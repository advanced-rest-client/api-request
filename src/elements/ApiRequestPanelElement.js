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
import { ArcHeaders } from '@advanced-rest-client/arc-headers';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import elementStyles from '../styles/Panel.styles.js';
import { EventTypes } from '../events/EventTypes.js';
import '../../api-request-editor.js';
import '../../api-response-view.js';

/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */

/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.Response} ArcResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcResponse.ErrorResponse} ErrorResponse */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.TransportRequest} TransportRequest */
/** @typedef {import('@advanced-rest-client/arc-types').ApiTypes.ApiType} ApiType */
/** @typedef {import('@advanced-rest-client/authorization').Oauth2Credentials} Oauth2Credentials */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('@api-components/api-server-selector').ServerType} ServerType */
/** @typedef {import('../types').ApiConsoleResponse} ApiConsoleResponse */
/** @typedef {import('../events/RequestEvents').ApiRequestEvent} ApiRequestEvent */
/** @typedef {import('../events/RequestEvents').ApiResponseEvent} ApiResponseEvent */

export const selectedValue = Symbol('selectedValue');
export const selectedChanged = Symbol('selectedChanged');
export const appendProxy = Symbol('appendProxy');
export const propagateResponse = Symbol('propagateResponse');
export const responseHandler = Symbol('responseHandler');
export const requestHandler = Symbol('requestHandler');
export const appendConsoleHeaders = Symbol('appendConsoleHeaders');
export const navigationHandler = Symbol('navigationHandler');
export const requestTemplate = Symbol('requestTemplate');
export const responseTemplate = Symbol('requestTemplate');

export default class ApiRequestPanelElement extends EventsTargetMixin(LitElement) {
  get styles() {
    return elementStyles;
  }

  /**
   * True when the panel render the response.
   * @returns {boolean}
   */
  get hasResponse() {
    return !!this.response;
  }

  static get properties() {
    return {
      /**
       * The `amf` property that passes amf model to the request editor.
       */
      amf: { type: Object },
      /**
       * AMF HTTP method (operation in AMF vocabulary) ID.
       */
      selected: { type: String },
      /**
       * By default application hosting the element must set `selected`
       * property. When using `api-navigation` element
       * by setting this property the element listens for navigation events
       * and updates the state
       */
      handleNavigationEvents: { type: Boolean },
      /**
       * When set it renders the URL input above the URL parameters.
       */
      urlEditor: { type: Boolean },
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
       * OAuth2 redirect URI.
       * This value **must** be set in order for OAuth 1/2 to work properly.
       */
      redirectUri: { type: String },
      /**
       * Enables compatibility with Anypoint styling
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * Created by the transport ARC `request` object
       */
      request: { type: Object },
      /**
       * Created by the transport ARC `response` object.
       */
      response: { type: Object },
      /**
       * Forces the console to send headers defined in this string overriding any used defined
       * header.
       * This should be an array of headers with `name` and `value` keys, e.g.:
       * ```
       * [{
       *   name: "x-token",
       *   value: "value"
       * }]
       * ```
       */
      appendHeaders: { type: Array },
      /**
       * If set every request made from the console will be proxied by the service provided in this
       * value.
       * It will prefix entered URL with the proxy value. so the call to
       * `http://domain.com/path/?query=some+value` will become
       * `https://proxy.com/path/http://domain.com/path/?query=some+value`
       *
       * If the proxy require a to pass the URL as a query parameter define value as follows:
       * `https://proxy.com/path/?url=`. In this case be sure to set `proxy-encode-url`
       * attribute.
       */
      proxy: { type: String },
      /**
       * If `proxy` is set, it will URL encode the request URL before appending it to the proxy URL.
       * `http://domain.com/path/?query=some+value` will become
       * `https://proxy.com/?url=http%3A%2F%2Fdomain.com%2Fpath%2F%3Fquery%3Dsome%2Bvalue`
       */
      proxyEncodeUrl: { type: Boolean },
      
      /**
       * ID of latest request.
       * It is received from the `api-request-editor` when `api-request`
       * event is dispatched. When `api-response` event is handled
       * the id is compared and if match it renders the result.
       *
       * This system allows to use different request panels on single app
       * and don't mix the results.
       */
      lastRequestId: { type: String },
      /**
       * If set it computes `hasOptional` property and shows checkbox in the
       * form to show / hide optional properties.
       */
      allowHideOptional: { type: Boolean },
      /**
       * When set, renders "add custom" item button.
       * If the element is to be used without AMF model this should always
       * be enabled. Otherwise users won't be able to add a parameter.
       */
      allowCustom: { type: Boolean },
      /**
       * Holds the value of the currently selected server
       * Data type: URI
       */
      serverValue: { type: String },
      /**
       * Holds the type of the currently selected server
       * Values: `server` | `slot` | `custom`
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
    return this[selectedValue];
  }

  set selected(value) {
    const old = this[selectedValue];
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this[selectedValue] = value;
    this.requestUpdate('selected', old);
    this[selectedChanged](value);
  }

  constructor() {
    super();
    this[responseHandler] = this[responseHandler].bind(this);
    this[requestHandler] = this[requestHandler].bind(this);
    this[navigationHandler] = this[navigationHandler].bind(this);
    /** @type ApiType[] */
    this.appendHeaders = null;
    /** @type string */
    this.proxy = undefined;
    /** @type boolean */
    this.proxyEncodeUrl = false;
    /** @type boolean */
    this.handleNavigationEvents = false;
    /** @type AmfDocument */
    this.amf = undefined;
    /** @type boolean */
    this.urlEditor = undefined;
    /** @type boolean */
    this.urlLabel = undefined;
    /** @type string */
    this.baseUri = undefined;
    this.eventsTarget = undefined;
    /** @type boolean */
    this.allowHideOptional = false;
    /** @type boolean */
    this.allowCustom = false;
    /** @type boolean */
    this.compatibility = false;
    /** @type boolean */
    this.outlined = false;
    /** @type string */
    this.serverValue = undefined;
    /** @type ServerType */
    this.serverType = undefined;
    /** @type string */
    this.redirectUri = undefined;
    /** @type boolean */
    this.noServerSelector = false;
    this.allowCustomBaseUri = false;
    /** @type boolean */
    this.globalCache = undefined;
    /** @type boolean */
    this.applyAuthorization = undefined;
    /** @type Oauth2Credentials[] */
    this.credentialsSource = undefined;
    /** @type {TransportRequest} */
    this.request = undefined;
    /** @type {ArcResponse|ErrorResponse} */
    this.response = undefined;
  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    this.addEventListener(EventTypes.Request.apiRequest, this[requestHandler]);
    node.addEventListener(EventTypes.Request.apiResponse, this[responseHandler]);
    node.addEventListener(EventTypes.Request.apiResponseLegacy, this[responseHandler]);
    node.addEventListener(
      'api-navigation-selection-changed',
      this[navigationHandler]
    );
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    this.removeEventListener(EventTypes.Request.apiRequest, this[requestHandler]);
    node.removeEventListener(EventTypes.Request.apiResponse, this[responseHandler]);
    node.removeEventListener(EventTypes.Request.apiResponseLegacy, this[responseHandler]);
    node.removeEventListener(
      'api-navigation-selection-changed',
      this[navigationHandler]
    );
  }

  /**
   * A handler for the API call.
   * This handler will only check if there is authorization required
   * and if the user is authorized.
   *
   * @param {ApiRequestEvent} e `api-request` event
   */
  [requestHandler](e) {
    this.lastRequestId = e.detail.id;
    this[appendConsoleHeaders](e);
    this[appendProxy](e);
  }

  /**
   * Appends headers defined in the `appendHeaders` array.
   * @param {ApiRequestEvent} e The `api-request` event.
   */
  [appendConsoleHeaders](e) {
    const headersToAdd = this.appendHeaders;
    if (!headersToAdd) {
      return;
    }
    const parser = new ArcHeaders(e.detail.headers || '');
    headersToAdd.forEach((header) => {
      const { name, value } = header;
      parser.set(name, value);
    });
    e.detail.headers = parser.toString();
  }

  /**
   * Sets the proxy URL if the `proxy` property is set.
   * @param {ApiRequestEvent} e The `api-request` event.
   */
  [appendProxy](e) {
    const { proxy } = this;
    if (!proxy) {
      return;
    }
    let { url } = e.detail;
    if (this.proxyEncodeUrl) {
      url = encodeURIComponent(url);
    }
    e.detail.url = `${proxy}${url}`;
  }

  /**
   * Handler for the `api-response` custom event. Sets values on the response
   * panel when response is ready.
   *
   * @param {ApiResponseEvent} e
   */
  [responseHandler](e) {
    const response = /** @type ApiConsoleResponse */ (e.detail);
    if (this.lastRequestId !== response.id) {
      return;
    }
    this[propagateResponse](response);
  }

  /**
   * Propagate `api-response` detail object.
   * 
   * Until API Console v 6.x it was using a different response view. The current version 
   * uses new response view based on ARC response view which uses different data structure.
   * This function transforms the response to the one of the corresponding data types used in ARC.
   * However, this keeps compatibility with previous versions of the transport library so it is
   * safe to upgrade the console without changing the HTTP request process.
   *
   * @param {ApiConsoleResponse} data Event's detail object
   */
  async [propagateResponse](data) {
    if (data.isError) {
      this.response = /** @type ErrorResponse */ ({
        error: data.error,
        statusText: data.response.statusText,
        status: data.response.status,
        headers: data.response.headers,
        id: data.id,
        payload: data.response.payload,
      });
    } else {
      this.response = /** @type ArcResponse */ ({
        loadingTime: data.loadingTime,
        statusText: data.response.statusText,
        status: data.response.status,
        headers: data.response.headers,
        id: data.id,
        payload: data.response.payload,
      });
    }
    this.request = /** @type TransportRequest */({
      httpMessage: '',
      method: data.request.method,
      endTime: 0,
      startTime: 0,
      url: data.request.url,
      headers: data.request.headers,
      payload: data.request.payload,
    });
    await this.updateComplete;
    this.dispatchEvent(new Event('resize', { bubbles: true, composed: true }));
  }

  /**
   * Clears response panel when selected id changed.
   * @param {String} id
   */
  [selectedChanged](id) {
    if (!id) {
      return;
    }
    this.clearResponse();
  }

  /**
   * Clears response panel.
   */
  clearResponse() {
    if (this.request) {
      this.request = undefined;
    }
    if (this.response) {
      this.response = undefined;
    }
  }

  /**
   * Handles navigation events and computes available servers.
   *
   * When `handleNavigationEvents` is set then it also manages the selection.
   *
   * @param {CustomEvent} e
   */
  [navigationHandler](e) {
    if (this.handleNavigationEvents) {
      const { selected: id, type } = e.detail;
      this.selected = type === 'method' ? id : undefined;
    }
  }

  render() {
    return html`<style>${this.styles}</style>${this[requestTemplate]()}${this[responseTemplate]()}`;
  }

  /**
   * @return {TemplateResult} A template for the request panel
   */
  [requestTemplate]() {
    const {
      redirectUri,
      selected,
      amf,
      urlEditor,
      urlLabel,
      baseUri,
      eventsTarget,
      allowHideOptional,
      allowCustom,
      compatibility,
      outlined,
      serverValue,
      serverType,
      noServerSelector,
      allowCustomBaseUri,
      credentialsSource,
      globalCache,
      applyAuthorization,
    } = this;

    return html`
    <api-request-editor
      .redirectUri="${redirectUri}"
      .selected="${selected}"
      .amf="${amf}"
      ?urlEditor="${urlEditor}"
      ?urlLabel="${urlLabel}"
      .baseUri="${baseUri}"
      .eventsTarget="${eventsTarget}"
      ?allowHideOptional="${allowHideOptional}"
      ?allowCustom="${allowCustom}"
      ?outlined="${outlined}"
      ?compatibility="${compatibility}"
      .serverValue="${serverValue}"
      .serverType="${serverType}"
      ?noServerSelector="${noServerSelector}"
      ?allowCustomBaseUri="${allowCustomBaseUri}"
      .credentialsSource="${credentialsSource}"
      ?globalCache="${globalCache}"
      ?applyAuthorization="${applyAuthorization}"
    >
      <slot name="custom-base-uri" slot="custom-base-uri"></slot>
    </api-request-editor>`;
  }

  /**
   * @return {TemplateResult|string} A template for the response view
   */
  [responseTemplate]() {
    const { hasResponse } = this;
    if (!hasResponse) {
      return '';
    }
    return html`<api-response-view
      .request="${this.request}"
      .response="${this.response}"
      .compatibility="${this.compatibility}"
    ></api-response-view>`;
  }
}
