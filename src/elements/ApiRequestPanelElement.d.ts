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
import { TemplateResult, LitElement, CSSResult } from 'lit-element';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { ErrorResponse, Response as ArcResponse } from '@advanced-rest-client/arc-types/src/request/ArcResponse';
import { TransportRequest } from '@advanced-rest-client/arc-types/src/request/ArcRequest';
import { ApiConsoleResponse } from '../types';
import { Oauth2Credentials } from '@advanced-rest-client/authorization';

export declare class ApiRequestPanelElement extends EventsTargetMixin(LitElement) {
  get styles(): CSSResult;

  get _hasResponse(): boolean;

  /**
   * The `amf` property that passes amf model to the request editor.
   */
  amf: any;
  /**
   * AMF HTTP method (operation in AMF vocabulary) ID.
   * @attribute
   */
  selected: string;
  /**
   * By default application hosting the element must set `selected`
   * property. When using `api-navigation` element
   * by setting this property the element listens for navigation events
   * and updates the state
   * @attribute
   */
  handleNavigationEvents: boolean;
  /**
   * Hides the URL editor from the view.
   * The editor is still in the DOM and the `urlInvalid` property still will be set.
   * @attribute
   */
  noUrlEditor: boolean;
  /**
   * When set it renders a label with the computed URL.
   * This intended to be used with `noUrlEditor` set to true.
   * This way it replaces the editor with a simple label.
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
   * When set the editor is in read only mode.
   * @attribute
   */
  readOnly: boolean;
  /**
   * When set all controls are disabled in the form
   * @attribute
   */
  disabled: boolean;
  /**
   * Created by the transport ARC `request` object
   */
  request: TransportRequest;
  /**
   * Created by the transport ARC `response` object.
   */
  response: ArcResponse|ErrorResponse;
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
  appendHeaders: { name: string, value: string }[]
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
   * Location of the `node_modules` folder.
   * It should be a path from server's root path including node_modules.
   * @attribute
   */
  authPopupLocation: string;
  /**
   * ID of latest request.
   * It is received from the `api-request-editor` when `api-request`
   * event is dispatched. When `api-response` event is handled
   * the id is compared and if match it renders the result.
   *
   * This system allows to use different request panels on single app
   * and don't mix the results.
   * @attribute
   */
  lastRequestId: string;
  /**
   * If set it computes `hasOptional` property and shows checkbox in the
   * form to show / hide optional properties.
   * @attribute
   */
  allowHideOptional: boolean;
  /**
   * If set, enable / disable param checkbox is rendered next to each
   * form item.
   * @attribute
   */
  allowDisableParams: boolean;
  /**
   * When set, renders "add custom" item button.
   * If the element is to be used without AMF model this should always
   * be enabled. Otherwise users won't be able to add a parameter.
   * @attribute
   */
  allowCustom: boolean;
  /**
   * API server definition from the AMF model.
   *
   * This value to be set when partial AMF model for an endpoint is passed
   * instead of web api to be passed to the `api-url-data-model` element.
   *
   * Do not set with full AMF web API model.
   */
  server: any;
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
  protocols: string[];
  /**
   * API version name.
   *
   * This value to be set when partial AMF model for an endpoint is passed
   * instead of web api to be passed to the `api-url-data-model` element.
   *
   * Do not set with full AMF web API model.
   * @attribute
   */
  version: string;
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
  serverType: string;
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
  credentialsSource: Oauth2Credentials[]
  /**
   * When enabled, does not clear cache on AMF change
   * @attribute
   */
  persistCache: boolean;

  constructor();

  connectedCallback(): void;

  _attachListeners(node: EventTarget): void;

  _detachListeners(node: EventTarget): void;

  /**
   * Sets OAuth 2 redirect URL for the authorization panel
   *
   * @param location components location
   */
  _updateRedirectUri(location?: string): void;

  /**
   * A handler for the API call.
   * This handler will only check if there is authorization required
   * and if the user is authorized.
   *
   * @param e `api-request` event
   */
  _apiRequestHandler(e: CustomEvent): void;

  /**
   * Appends headers defined in the `appendHeaders` array.
   * @param e The `api-request` event.
   */
  _appendConsoleHeaders(e: CustomEvent): void;

  /**
   * Sets the proxy URL if the `proxy` property is set.
   * @param e The `api-request` event.
   */
  _appendProxy(e: CustomEvent): void;

  /**
   * Handler for the `api-response` custom event. Sets values on the response
   * panel when response is ready.
   */
  _apiResponseHandler(e: CustomEvent): void;

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
  _propagateResponse(data: ApiConsoleResponse): void;

  /**
   * Clears response panel when selected id changed.
   */
  _selectedChanged(id: string): void;

  /**
   * Clears response panel.
   */
  clearResponse(): void;

  /**
   * Handles navigation events and computes available servers.
   *
   * When `handleNavigationEvents` is set then it also manages the selection.
   */
  _handleNavigationChange(e: CustomEvent): void;

  render(): TemplateResult;

  /**
   * @return A template for the request panel
   */
  _requestTemplate(): TemplateResult;

  /**
   * @return A template for the response view
   */
  _responseTemplate(): TemplateResult|string;
}
