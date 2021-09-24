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
import { FormItem } from '@advanced-rest-client/arc-types/src/forms/FormTypes';
import { ApiConsoleRequest } from '../types';

/**
 * `xhr-simple-request`
 * A XHR request that works with API components.
 *
 * This is a copy of `iron-request` element from PolymerElements library but
 * adjusted to work with `API request` object (or ARC request object).
 *
 * It also handles custom events related to request flow.
 */
export declare class XhrSimpleRequestTransportElement extends LitElement {
  /**
   * A reference to the XMLHttpRequest instance used to generate the
   * network request.
   */
  _xhr: XMLHttpRequest;

  /**
   * A reference to the parsed response body, if the `xhr` has completely
   * resolved.
   */
  _response: any;

  /**
   * A reference to response headers, if the `xhr` has completely
   * resolved.
   */
  _headers: string

  /**
   * A reference to the status code, if the `xhr` has completely resolved.
   */
  _status: number;

  /**
   * A reference to the status text, if the `xhr` has completely resolved.
   */
  _statusText: string;
  /**
   * A promise that resolves when the `xhr` response comes back, or rejects
   * if there is an error before the `xhr` completes.
   * The resolve callback is called with the original request as an argument.
   * By default, the reject callback is called with an `Error` as an argument.
   * If `rejectWithRequest` is true, the reject callback is called with an
   * object with two keys: `request`, the original request, and `error`, the
   * error object.
   */
  _completes: Promise<any>;

  /**
   * Aborted will be true if an abort of the request is attempted.
   */
  _aborted: boolean;

  /**
   * It is true when the browser fired an error event from the
   * XHR object (mainly network errors).
   */
  _error: boolean;

  /**
   * TimedOut will be true if the XHR threw a timeout event.
   */
  _timedOut: boolean;
  /**
   * Appends headers to each request handled by this component.
   *
   * Example
   *
   * ```html
   * <xhr-simple-request
   *  append-headers="x-token: 123\nx-api-demo: true"></xhr-simple-request>
   * ```
   * @attribute
   */
  appendHeaders: string;
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
   * @attribute
   */
  proxy: string;
  /**
   * If `proxy` is set, it will URL encode the request URL before appending it to the proxy URL.
   * `http://domain.com/path/?query=some+value` will become
   * `https://proxy.com/?url=http%3A%2F%2Fdomain.com%2Fpath%2F%3Fquery%3Dsome%2Bvalue`
   * @attribute
   */
  proxyEncodeUrl: boolean;

  /**
   * A reference to the parsed response body, if the `xhr` has completely
   * resolved.
   */
  get response(): any;

  /**
   * A reference to response headers, if the `xhr` has completely
   * resolved.
   */
  get headers(): string;

  /**
   * A reference to the status code, if the `xhr` has completely resolved.
   */
  get status(): number;

  get statusText(): string;

  /**
   * A promise that resolves when the `xhr` response comes back, or rejects
   * if there is an error before the `xhr` completes.
   * The resolve callback is called with the original request as an argument.
   * By default, the reject callback is called with an `Error` as an argument.
   * If `rejectWithRequest` is true, the reject callback is called with an
   * object with two keys: `request`, the original request, and `error`, the
   * error object.
   */
  get completes(): Promise<any>;


  /**
   * Aborted will be true if an abort of the request is attempted.
   */
  get aborted(): boolean;

  /**
   * Error will be true if the browser fired an error event from the
   * XHR object (mainly network errors).
   */
  get error(): boolean;

  /**
   * Aborted will be true if an abort of the request is attempted.
   */
  get timedOut(): boolean;

  resolveCompletes: Function;
  rejectCompletes: Function;

  constructor();

  connectedCallback(): void;

  /**
   * Succeeded is true if the request succeeded. The request succeeded if it
   * loaded without error, wasn't aborted, and the status code is ≥ 200, and
   * < 300, or if the status code is 0.
   *
   * The status code 0 is accepted as a success because some schemes - e.g.
   * file:// - don't provide status codes.
   */
  get succeeded(): boolean;

  /**
   * Sends a request.
   *
   * @param {ApiConsoleRequest} options API request object
   * @return {Promise}
   */
  send(options: ApiConsoleRequest): Promise<any>;

  /**
   * Applies headers to the XHR object.
   *
   * @param {XMLHttpRequest} xhr
   * @param {string=} headers HTTP headers string
   * @param {boolean=} isFormData Prevents setting content-type header for
   * Multipart requests.
   */
  _applyHeaders(xhr: XMLHttpRequest, headers?: string, isFormData?: boolean): void;

  /**
   * Handler for XHR `error` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-error
   */
  _errorHandler(error): void;

  /**
   * Handler for XHR `timeout` event.
   *
   * @param {ProgressEvent} error https://xhr.spec.whatwg.org/#event-xhr-timeout
   */
  _timeoutHandler(error): void;

  /**
   * Handler for XHR `abort` event.
   */
  _abortHandler(): void;

  /**
   * Handler for XHR `loadend` event.
   */
  _loadEndHandler(): void;
  
  /**
   * Aborts the request.
   */
  abort(): void;

  /**
   * Updates the status code and status text.
   */
  _updateStatus(): void;

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
   * @return The parsed response, or undefined if there was an empty response or parsing failed.
   */
  parseResponse(): any;

  /**
   * Collects response headers string from the XHR object.
   *
   * @return {string|undefined}
   */
  collectHeaders(): string|undefined;

  /**
   * Computes value for `_addHeaders` property.
   * A list of headers to add to each request.
   * @param headers Headers string
   */
  _computeAddHeaders(headers: string): FormItem[]|undefined;

  /**
   * Sets the proxy URL if the `proxy` property is set.
   * @param {string} url Request URL to alter if needed.
   * @return {string} The URL to use with request.
   */
  _appendProxy(url: string): string;
}
