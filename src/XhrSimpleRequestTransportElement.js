/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/**
@license
Copyright 2018 The Advanced REST client authors <arc@mulesoft.com>
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
import { LitElement } from 'lit-element';
import { HeadersParser } from '@advanced-rest-client/arc-headers';

/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.FormItem} FormItem */
/** @typedef {import('./types').ApiConsoleRequest} ApiConsoleRequest */

/**
 * `xhr-simple-request`
 * A XHR request that works with API components.
 *
 * This is a copy of `iron-request` element from PolymerElements library but
 * adjusted to work with `API request` object (or ARC request object).
 *
 * It also handles custom events related to request flow.
 */
export class XhrSimpleRequestTransportElement extends LitElement {
  static get properties() {
    return {
      /**
       * A reference to the XMLHttpRequest instance used to generate the
       * network request.
       */
      _xhr: { type: Object },

      /**
       * A reference to the parsed response body, if the `xhr` has completely
       * resolved.
       */
      _response: { type: Object },

      /**
       * A reference to response headers, if the `xhr` has completely
       * resolved.
       * @default undefined
       */
      _headers: { type: Object },

      /**
       * A reference to the status code, if the `xhr` has completely resolved.
       */
      _status: { type: Number },

      /**
       * A reference to the status text, if the `xhr` has completely resolved.
       */
      _statusText: { type: String },
      /**
       * A promise that resolves when the `xhr` response comes back, or rejects
       * if there is an error before the `xhr` completes.
       * The resolve callback is called with the original request as an argument.
       * By default, the reject callback is called with an `Error` as an argument.
       * If `rejectWithRequest` is true, the reject callback is called with an
       * object with two keys: `request`, the original request, and `error`, the
       * error object.
       */
      _completes: { type: Object },

      /**
       * Aborted will be true if an abort of the request is attempted.
       */
      _aborted: { type: Boolean },

      /**
       * It is true when the browser fired an error event from the
       * XHR object (mainly network errors).
       */
      _error: { type: Boolean },

      /**
       * TimedOut will be true if the XHR threw a timeout event.
       */
      _timedOut: { type: Boolean },
      /**
       * Appends headers to each request handled by this component.
       *
       * Example
       *
       * ```html
       * <xhr-simple-request
       *  append-headers="x-token: 123\nx-api-demo: true"></xhr-simple-request>
       * ```
       */
      appendHeaders: { type: String },
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
      proxyEncodeUrl: { type: Boolean }
    };
  }

  /**
   * A reference to the parsed response body, if the `xhr` has completely
   * resolved.
   */
  get response() {
    return this._response;
  }

  /**
   * A reference to response headers, if the `xhr` has completely
   * resolved.
   */
  get headers() {
    return this._headers;
  }

  /**
   * A reference to the status code, if the `xhr` has completely resolved.
   *
   * @returns {number}
   */
  get status() {
    return this._status;
  }

  get statusText() {
    return this._statusText;
  }

  /**
   * A promise that resolves when the `xhr` response comes back, or rejects
   * if there is an error before the `xhr` completes.
   * The resolve callback is called with the original request as an argument.
   * By default, the reject callback is called with an `Error` as an argument.
   * If `rejectWithRequest` is true, the reject callback is called with an
   * object with two keys: `request`, the original request, and `error`, the
   * error object.
   *
   * @return {Promise}
   */
  get completes() {
    return this._completes;
  }

  /**
   * Aborted will be true if an abort of the request is attempted.
   *
   * @default false
   * @return {boolean}
   */
  get aborted() {
    return this._aborted;
  }

  /**
   * Error will be true if the browser fired an error event from the
   * XHR object (mainly network errors).
   */
  get error() {
    return this._error;
  }

  /**
   * Aborted will be true if an abort of the request is attempted.
   */
  get timedOut() {
    return this._timedOut;
  }

  constructor() {
    super();
    this._xhr = new XMLHttpRequest();
    this._response = null;
    this._status = 0;
    this._statusText = '';
    this.appendHeaders = undefined;
    this._completes = new Promise((resolve, reject) => {
      this.resolveCompletes = resolve;
      this.rejectCompletes = reject;
    });
    this._aborted = false;
    this._error = false;
    this._timedOut = false;
    this.proxy = undefined;
    this.proxyEncodeUrl = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('aria-hidden', 'true');
  }

  /**
   * Succeeded is true if the request succeeded. The request succeeded if it
   * loaded without error, wasn't aborted, and the status code is ≥ 200, and
   * < 300, or if the status code is 0.
   *
   * The status code 0 is accepted as a success because some schemes - e.g.
   * file:// - don't provide status codes.
   *
   * @return {boolean}
   */
  get succeeded() {
    if (this.error || this.aborted || this.timedOut) {
      return false;
    }
    const status = this._xhr.status || 0;

    // Note: if we are using the file:// protocol, the status code will be 0
    // for all outcomes (successful or otherwise).
    return status === 0 || (status >= 200 && status < 300);
  }

  /**
   * Sends a request.
   *
   * @param {ApiConsoleRequest} options API request object
   * @return {Promise}
   */
  send(options) {
    const xhr = this._xhr;
    if (xhr.readyState > 0) {
      return null;
    }
    xhr.addEventListener('error', (error) => this._errorHandler(error));
    xhr.addEventListener('timeout', (error) => this._timeoutHandler(error));
    xhr.addEventListener('abort', () => this._abortHandler());
    // Called after all of the above.
    xhr.addEventListener('loadend', () => this._loadEndHandler());
    const url = this._appendProxy(options.url);
    xhr.open(options.method || 'GET', url, true);
    this._applyHeaders(xhr, options.headers, options.payload instanceof FormData);
    xhr.timeout = options.timeout;
    xhr.withCredentials = !!options.withCredentials;
    try {
      xhr.send(options.payload);
    } catch (e) {
      this._errorHandler(e);
    }
    return this.completes;
  }

  /**
   * Applies headers to the XHR object.
   *
   * @param {XMLHttpRequest} xhr
   * @param {string=} headers HTTP headers string
   * @param {boolean=} isFormData Prevents setting content-type header for
   * Multipart requests.
   */
  _applyHeaders(xhr, headers, isFormData) {
    const fixed = this._computeAddHeaders(this.appendHeaders);
    const fixedNames = [];
    if (fixed && fixed.length) {
      fixed.forEach((item) => {
        fixedNames[fixedNames.length] = item.name;
        try {
          xhr.setRequestHeader(item.name, item.value);
        } catch (e) {
          // ..
        }
      });
    }
    if (headers) {
      const data = HeadersParser.toJSON(String(headers));
      data.forEach((item) => {
        if (fixedNames.indexOf(item.name) !== -1) {
          return;
        }
        if (isFormData && item.name.toLowerCase() === 'content-type') {
          return;
        }
        try {
          xhr.setRequestHeader(item.name, item.value);
        } catch (e) {
          // ..
        }
      });
    }
  }

  /**
   * Handler for XHR `error` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-error
   */
  _errorHandler(error) {
    if (this.aborted) {
      return;
    }
    this._error = true;
    this._updateStatus();
    this._headers = this.collectHeaders();
    const response = {
      error,
      request: this._xhr,
      headers: this.headers
    };
    this.rejectCompletes(response);
  }

  /**
   * Handler for XHR `timeout` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-timeout
   */
  _timeoutHandler(error) {
    this._timedOut = true;
    this._updateStatus();
    const response = {
      error,
      request: this._xhr
    };
    this.rejectCompletes(response);
  }

  /**
   * Handler for XHR `abort` event.
   */
  _abortHandler() {
    this._aborted = true;
    this._updateStatus();
    const error = new Error('Request aborted');
    const response = {
      error,
      request: this._xhr
    };
    this.rejectCompletes(response);
  }

  /**
   * Handler for XHR `loadend` event.
   */
  _loadEndHandler() {
    if (this.aborted || this.timedOut) {
      return;
    }
    this._updateStatus();
    this._headers = this.collectHeaders();
    this._response = this.parseResponse();
    if (!this.succeeded) {
      const error = new Error(`The request failed with status code: ${  this._xhr.status}`);
      const response = {
        error,
        request: this._xhr,
        headers: this.headers
      };
      this.rejectCompletes(response);
    } else {
      this.resolveCompletes({
        response: this.response,
        headers: this.headers
      });
    }
  }
  
  /**
   * Aborts the request.
   */
  abort() {
    this._aborted = true;
    this._xhr.abort();
  }

  /**
   * Updates the status code and status text.
   */
  _updateStatus() {
    this._status = this._xhr.status;
    this._statusText = (this._xhr.statusText === undefined ? '' : this._xhr.statusText);
  }

  /**
   * Attempts to parse the response body of the XHR. If parsing succeeds,
   * the value returned will be deserialized based on the `responseType`
   * set on the XHR.
   *
   * TODO: The `responseType` will always be empty string because
   * send function does not sets the response type.
   * API request object does not support this property. However in the future
   * it may actually send this information extracted from the AMF model.
   * This function will be ready to handle this case.
   *
   * @return {*} The parsed response,
   * or undefined if there was an empty response or parsing failed.
   */
  parseResponse() {
    const xhr = this._xhr;
    const { responseType } = xhr;
    const preferResponseText = !xhr.responseType;
    try {
      switch (responseType) {
        case 'json':
          // If the xhr object doesn't have a natural `xhr.responseType`,
          // we can assume that the browser hasn't parsed the response for us,
          // and so parsing is our responsibility. Likewise if response is
          // undefined, as there's no way to encode undefined in JSON.
          if (preferResponseText || xhr.response === undefined) {
            // Try to emulate the JSON section of the response body section of
            // the spec: https://xhr.spec.whatwg.org/#response-body
            // That is to say, we try to parse as JSON, but if anything goes
            // wrong return null.
            try {
              return JSON.parse(xhr.responseText);
            } catch (_) {
              return null;
            }
          }
          return xhr.response;
        // case 'xml':
        //   return xhr.responseXML;
        case 'blob':
        case 'document':
        case 'arraybuffer':
          return xhr.response;
        case 'text':
          return xhr.responseText;
        default: {
          return xhr.responseText;
        }
      }
    } catch (e) {
      this.rejectCompletes(new Error(`Could not parse response. ${  e.message}`));
    }
    return undefined;
  }

  /**
   * Collects response headers string from the XHR object.
   *
   * @return {string|undefined}
   */
  collectHeaders() {
    let data;
    try {
      data = this._xhr.getAllResponseHeaders();
    } catch (_) {
      // ...
    }
    return data;
  }

  /**
   * Computes value for `_addHeaders` property.
   * A list of headers to add to each request.
   * @param {string} headers Headers string
   * @return {FormItem[]|undefined}
   */
  _computeAddHeaders(headers) {
    if (!headers) {
      return undefined;
    }
    headers = String(headers).replace('\\n', '\n');
    return HeadersParser.toJSON(headers);
  }

  /**
   * Sets the proxy URL if the `proxy` property is set.
   * @param {string} url Request URL to alter if needed.
   * @return {string} The URL to use with request.
   */
  _appendProxy(url) {
    const { proxy } = this;
    if (!proxy) {
      return url;
    }
    let result = this.proxyEncodeUrl ? encodeURIComponent(url) : url;
    result = proxy + result;
    return result;
  }
}
