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
import { TemplateResult, LitElement } from 'lit-element';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { AmfDocument } from '@api-components/amf-helper-mixin';
import { ArcResponse, ArcRequest, ApiTypes } from '@advanced-rest-client/arc-types';
import { Oauth2Credentials } from '@advanced-rest-client/authorization';
import { ServerType } from '@api-components/api-server-selector';
import { ApiConsoleResponse, ApiConsoleRequest } from '../types';
import { ApiRequestEvent, ApiResponseEvent } from '../events/RequestEvents';

export const selectedValue: unique symbol;
export const selectedChanged: unique symbol;
export const appendProxy: unique symbol;
export const propagateResponse: unique symbol;
export const responseHandler: unique symbol;
export const requestHandler: unique symbol;
export const appendConsoleHeaders: unique symbol;
export const navigationHandler: unique symbol;
export const requestTemplate: unique symbol;
export const responseTemplate: unique symbol;
export const changeHandler: unique symbol;

export default class ApiRequestPanelElement extends EventsTargetMixin(LitElement) {
  /**
   * True when the panel render the response.
   */
  get hasResponse(): boolean;

  /**
   * The `amf` property that passes amf model to the request editor.
   */
  amf: AmfDocument;
  /**
  * AMF HTTP method (operation in AMF vocabulary) ID.
  * @attribute
  */
  selected: string;
  [selectedValue]: string;
  /**
  * By default application hosting the element must set `selected`
  * property. When using `api-navigation` element
  * by setting this property the element listens for navigation events
  * and updates the state
  * @attribute
  */
  handleNavigationEvents: boolean;
  /**
  * When set it renders the URL input above the URL parameters.
  * @attribute
  */
  urlEditor: boolean;
  /**
  * When set it renders a label with the computed URL.
  * @attribute
  */
  urlLabel: boolean;
  /**
  * A base URI for the API. To be set if RAML spec is missing `baseUri`
  * declaration and this produces invalid URL input. This information
  * is passed to the URL editor that prefixes the URL with `baseUri` value
  * if passed URL is a relative URL.
  * @attribute
  */
  baseUri: string;
  /**
  * OAuth2 redirect URI.
  * This value **must** be set in order for OAuth 1/2 to work properly.
  * @attribute
  */
  redirectUri: string;
  /**
  * Enables compatibility with Anypoint styling
  * @attribute
  */
  compatibility: boolean;
  /**
  * Enables Material Design outlined style
  * @attribute
  */
  outlined: boolean;
  /**
  * Created by the transport ARC `request` object
  */
  request: ArcRequest.TransportRequest;
  /**
  * Created by the transport ARC `response` object.
  */
  response: ArcResponse.Response|ArcResponse.ErrorResponse;
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
  appendHeaders: ApiTypes.ApiType[];
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
  * ID of latest request.
  * It is received from the `api-request-editor` when `api-request`
  * event is dispatched. When `api-response` event is handled
  * the id is compared and if match it renders the result.
  *
  * This system allows to use different request panels on single app
  * and don't mix the results.
  */
  lastRequestId: string;
  /**
  * If set it computes `hasOptional` property and shows checkbox in the
  * form to show / hide optional properties.
  * @attribute
  */
  allowHideOptional: boolean;
  /**
  * When set, renders "add custom" item button.
  * If the element is to be used without AMF model this should always
  * be enabled. Otherwise users won't be able to add a parameter.
  * @attribute
  */
  allowCustom: boolean;
  /**
  * Holds the value of the currently selected server
  * Data type: URI
  * @attribute
  */
  serverValue: string;
  /**
  * Holds the type of the currently selected server
  * Values: `server` | `slot` | `custom`
  * @attribute
  */
  serverType: ServerType;
  /**
  * Optional property to set
  * If true, the server selector is not rendered
  * @attribute
  */
  noServerSelector: boolean;
  /**
  * Optional property to set
  * If true, the server selector custom base URI option is rendered
  * @attribute
  */
  allowCustomBaseUri: boolean;
  /**
  * List of credentials source
  */
  credentialsSource: Oauth2Credentials[];
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
  * @attribute
  */
  applyAuthorization: boolean;
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
   * @attribute
   */
  globalCache: boolean;
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Serializes the state of the request editor into the `ApiConsoleRequest` object.
   */
  serialize(): ApiConsoleRequest;

  /**
   * A handler for the API call.
   * This handler will only check if there is authorization required
   * and if the user is authorized.
   */
  [requestHandler](e: ApiRequestEvent): void;

  /**
   * Appends headers defined in the `appendHeaders` array.
   */
  [appendConsoleHeaders](e: ApiRequestEvent): void;

  /**
   * Sets the proxy URL if the `proxy` property is set.
   */
  [appendProxy](e: ApiRequestEvent): void;

  /**
   * Handler for the `api-response` custom event. Sets values on the response
   * panel when response is ready.
   */
  [responseHandler](e: ApiResponseEvent): void;

  /**
   * Propagate `api-response` detail object.
   * 
   * Until API Console v 6.x it was using a different response view. The current version 
   * uses new response view based on ARC response view which uses different data structure.
   * This function transforms the response to the one of the corresponding data types used in ARC.
   * However, this keeps compatibility with previous versions of the transport library so it is
   * safe to upgrade the console without changing the HTTP request process.
   *
   * @param data Event's detail object
   */
  [propagateResponse](data: ApiConsoleResponse): void;

  /**
   * Clears response panel when selected id changed.
   */
  [selectedChanged](id: string): void;

  /**
   * Clears response panel.
   */
  clearResponse(): void;

  /**
   * Handles navigation events and computes available servers.
   *
   * When `handleNavigationEvents` is set then it also manages the selection.
   */
  [navigationHandler](e: CustomEvent): void;

  /**
   * Retargets the change event from the editor.
   */
  [changeHandler](): void;

  render(): TemplateResult;

  /**
   * @returns A template for the request panel
   */
  [requestTemplate](): TemplateResult;

  /**
   * @returns A template for the response view
   */
  [responseTemplate](): TemplateResult|string;
}
