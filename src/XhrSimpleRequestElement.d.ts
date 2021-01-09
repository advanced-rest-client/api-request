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
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { ApiConsoleRequest, ApiConsoleResponse, XHRQueueItem } from './types';
import { XhrSimpleRequestTransportElement } from './XhrSimpleRequestTransportElement';

/**
 * `xhr-simple-request`
 * A XHR request that works with API components.
 *
 * It handles `api-request` and `abort-api-request` custom events that control
 * request flow in API components ecosystem.
 *
 * This makes a request by using `XMLHttpRequest` object.
 *
 * ## ARC request data model
 *
 * The `api-request` custom event has to contain ARC (Advanced REST client)
 * request data model. It expects the following properties:
 * - url (`String`) - Request URL
 * - method (`String`) - Request HTTP method.
 * - headers (`String|undefined`) - HTTP headers string
 * - payload (`String|FormData|File|ArrayBuffer|undefined`) Request body
 * - id (`String`) **required**, request id. It can be any string, it must be unique.
 *
 * Note, this library does not validates the values and use them as is.
 * Any error related to validation has to be handled by the application.
 *
 * ## api-response data model
 *
 * When response is ready the element dispatches `api-response` custom event
 * with following properties in the detail object.
 * - id (`String`) - Request incoming ID
 * - request (`Object`) - Original request object from `api-request` event
 * - loadingTime (`Number`) - High precise timing used by the performance API
 * - isError (`Boolean`) - Indicates if the request is error
 * - error (`Error|undefined`) - Error object
 * - response (`Object`) - The response data:
 *  - status (`Number`) - Response status code
 *  - statusText (`String`) - Response status text. Can be empty string.
 *  - payload (`String|Document|ArrayBuffer|Blob`) - Response body
 *  - headers (`String|undefined`) - Response headers
 *
 * Please note that aborting the request always sends `api-response` event
 * with `isError` set to true.
 */
export declare class XhrSimpleRequestElement extends EventsTargetMixin(LitElement) {
  /**
   * Map of active request objects.
   * Keys in the map is the request ID and value is instance of the
   * `XhrSimpleRequestTransport`
   */
  activeRequests: Map<string, XHRQueueItem>;
  /**
   * True while loading latest started requests.
   */
  _loading: boolean;
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
  proxyEncodeUrl: string;

  /**
   * True while loading latest started requests.
   */
  get loading(): boolean;

  constructor();

  connectedCallback(): void;

  _attachListeners(node: EventTarget): void;

  _detachListeners(node: EventTarget): void;

  /**
   * Creates instance of transport object with current configuration.
   */
  _createRequest(): XhrSimpleRequestTransportElement;

  /**
   * Handles for the `api-request` custom event. Transports the request.
   */
  _requestHandler(e: CustomEvent): void;

  /**
   * @param {ApiConsoleRequest} request 
   */
  execute(request: ApiConsoleRequest): Promise<void>;

  /**
   * Handler for `abort-api-request` event. Aborts the request and reports
   * error response.
   * It expects the event to have `id` property set on the detail object.
   * @param {CustomEvent} e
   */
  _abortHandler(e: CustomEvent): void;

  /**
   * Creates a detail object for `api-response` custom event
   *
   * @param {XHRQueueItem} info Request object
   * @param {string} id Request original ID
   * @return {ApiConsoleResponse} The value of the `detail` property.
   */
  _createDetail(info: XHRQueueItem, id: string): ApiConsoleResponse;

  /**
   * Handles response from the transport.
   *
   * @param {string} id Request ID
   */
  _responseHandler(id: string): void;

  /**
   * Handles transport error
   *
   * @param err Transport error object.
   * @param id Request ID
   */
  _errorHandler(err: Error, id: string): void;

  /**
   * Dispatches `api-response` custom event.
   *
   * @param detail Request and response data.
   */
  _notifyResponse(detail: ApiConsoleResponse): void;

  /**
   * Removes request from active requests.
   *
   * @param id Request ID.
   */
  _discardRequest(id: string): void;
}
