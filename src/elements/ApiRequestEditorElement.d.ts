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
import { AmfHelperMixin, AmfSerializer } from '@api-components/amf-helper-mixin';
import { Oauth2Credentials } from '@advanced-rest-client/authorization';
import { ApiEndPoint, ApiOperation, ApiPayload, ApiParameter, ApiServer, Operation, AmfDocument } from '@api-components/amf-helper-mixin';
import { ServerType } from '@api-components/api-server-selector';
import { AmfParameterMixin } from '../lib/AmfParameterMixin';
import { SecuritySelectorListItem, ApiConsoleRequest, OperationParameter } from '../types';

export const EventCategory: string;

export const domainIdValue: unique symbol;
export const operationValue: unique symbol;
export const endpointValue: unique symbol;
export const serializerValue: unique symbol;
export const loadingRequestValue: unique symbol;
export const requestIdValue: unique symbol;
export const baseUriValue: unique symbol;
export const urlInvalidValue: unique symbol;
export const serverLocalValue: unique symbol;
export const processOperation: unique symbol;
export const processEndpoint: unique symbol;
export const processSecurity: unique symbol;
export const processServers: unique symbol;
export const appendToParams: unique symbol;
export const securityList: unique symbol;
export const updateServer: unique symbol;
export const updateServerParameters: unique symbol;
export const updateEndpointParameters: unique symbol;
export const computeMethodAmfModel: unique symbol;
export const computeUrlValue: unique symbol;
export const collectReportParameters: unique symbol;
export const processSelection: unique symbol;
export const getOrderedPathParams: unique symbol;
export const validateUrl: unique symbol;
export const readUrlValidity: unique symbol;
export const authSelectorHandler: unique symbol;
export const mediaTypeSelectHandler: unique symbol;
export const modelBodyEditorChangeHandler: unique symbol;
export const rawBodyChangeHandler: unique symbol;
export const serverCountHandler: unique symbol;
export const serverHandler: unique symbol;
export const populateAnnotatedFieldsHandler: unique symbol;
export const authRedirectChangedHandler: unique symbol;
export const responseHandler: unique symbol;
export const sendHandler: unique symbol;
export const abortHandler: unique symbol;
export const optionalToggleHandler: unique symbol;
export const addCustomHandler: unique symbol;
export const authorizationTemplate: unique symbol;
export const authorizationSelectorTemplate: unique symbol;
export const authorizationSelectorItemTemplate: unique symbol;
export const mediaTypeSelectorTemplate: unique symbol;
export const bodyTemplate: unique symbol;
export const formDataEditorTemplate: unique symbol;
export const multipartEditorTemplate: unique symbol;
export const rawEditorTemplate: unique symbol;
export const headersTemplate: unique symbol;
export const parametersTemplate: unique symbol;
export const serverSelectorTemplate: unique symbol;
export const toggleOptionalTemplate: unique symbol;
export const urlLabelTemplate: unique symbol;
export const formActionsTemplate: unique symbol;
export const abortButtonTemplate: unique symbol;
export const sendButtonTemplate: unique symbol;
export const addCustomButtonTemplate: unique symbol;
export const urlEditorTemplate: unique symbol;
export const urlEditorChangeHandler: unique symbol;
export const computeUrlRegexp: unique symbol;
export const urlSearchRegexpValue: unique symbol;
export const applyUriValues: unique symbol;
export const applyQueryParamsValues: unique symbol;

/**
 * @fires apirequest
 * @fires apiabort
 * @fires api-request
 * @fires abort-api-request
 */
export class ApiRequestEditorElement extends AmfParameterMixin(AmfHelperMixin(EventsTargetMixin(LitElement))) {
  /** 
   * The currently selected media type for the payloads.
   * @attribute
   */
  mimeType: string;
  /**
  * An `@id` of selected AMF shape. When changed it computes
  * method model for the selection.
  * @attribute
  */
  selected: string;
  [domainIdValue]: string;
  /**
  * When set it renders a label with the computed URL.
  * @attribute
  */
  urlLabel: boolean;
  /**
  * When set it renders the URL input above the URL parameters.
  * @attribute
  */
  urlEditor: boolean;
  /**
  * A base URI for the API. To be set if RAML spec is missing `baseUri`
  * declaration and this produces invalid URL input. This information
  * is passed to the URL editor that prefixes the URL with `baseUri` value
  * if passed URL is a relative URL.
  * @attribute
  */
  baseUri: string;
  [baseUriValue]: string;
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
  * OAuth2 redirect URI.
  * This value **must** be set in order for OAuth 1/2 to work properly.
  * @attribute
  */
  redirectUri: string;
  /**
  * Final request URL including settings like `baseUri`, AMF
  * model settings and user provided parameters.
  * @attribute
  */
  url: string;
  /**
  * Holds the value of the currently selected server
  * Data type: URI
  * @attribute
  */
  serverValue: string;
  /**
  * Holds the type of the currently selected server
  * Values: `server` | `uri` | `custom`
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
  * The index of the selected security definition to apply.
  * @attribute
  */
  selectedSecurity: number;
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

  /**
   * @returns The HTTP method name.
   */
  get httpMethod(): string;

  /**
   * True when the request is being loaded.
   */
  get loadingRequest(): boolean;
  [loadingRequestValue]: boolean;

  /**
   * The current request id.
   */
  get requestId(): string;
  [requestIdValue]: string;

  /**
   * Currently used server definition.
   */
  get server(): ApiServer;

  /**
   * This is the final computed value for the baseUri to propagate downwards
   * If baseUri is defined, return baseUri
   * Else, return the selectedServerValue if serverType is not `server`
   */
  get effectiveBaseUri(): string;

  /**
   * True when there are not enough servers to render the selector
   */
  get serverSelectorHidden(): boolean;

  /**
   * The security requirement for the operation or undefined.
   */
  get security(): SecuritySelectorListItem[]|undefined;

  /**
   * The currently rendered payload, if any.
   */
  get payload(): ApiPayload|undefined;

  /**
   * The list of all possible payloads for this operation.
   */
  get payloads(): ApiPayload[]|undefined;

  /**
   * API defined base URI (current server + the endpoint)
   */
  get apiBaseUri(): string|undefined;

  /**
   * @returns True when the URL input is invalid.
   */
  get urlInvalid(): boolean;
  /** 
   * Set when the selection change, this is a JS object created form the 
   * supportedOperation definition of the AMF graph.
   */
  [operationValue]: ApiOperation;
  [endpointValue]: ApiEndPoint;
  /** 
   * The list of security list items to render.
   * An operation may have multiple security definition in an or/and fashion.
   * This allows to render the selector to pick the current security.
   */
  [securityList]: SecuritySelectorListItem[];
  [serializerValue]: AmfSerializer;
  /** 
   * The list of parameter groups that are opened when `allowHideOptional` is set.
   */
  openedOptional: string[];
  
  constructor();

  // for the AmfParameterMixin
  notifyChange(): void;
  _attachListeners(node: EventTarget): void;
  _detachListeners(node: EventTarget): void;

  /**
   * Overrides `AmfHelperMixin.__amfChanged`.
   * It updates selection and clears cache in the model generator, per APIC-229
   */
  __amfChanged(amf: AmfDocument): void;

  /**
   * Reads the URL data from the ApiUrlDataModel library and sets local variables.
   */
  readUrlData(): void;

  /**
   * A function to be overwritten by child classes to execute an action when a parameter has changed.
   */
  paramChanged(key: string): void;

  /**
   * Computes the URL value for the current serves, selected server, and endpoint's path.
   */
  [computeUrlValue](): void;

  /**
   * Creates a list of parameters that are used to generate the inputs report for `AmfInputParser.reportRequestInputs`
   */
  [collectReportParameters](): ApiParameter[];

  /**
   * Checks if the current server has variables and update the parameters array
   */
  [updateServerParameters](): void;

  /**
   * Checks if the current endpoint has variables and requests them when needed.
   */
  [updateEndpointParameters](): void;

  reset(): void;

  [processSelection](): void;

  /**
   * Searches for the current operation endpoint and sets variables from the endpoint definition.
   */
  [processEndpoint](): void;

  /**
   * Collects operations input parameters into a single object.
   */
  [processOperation](): void;

  /**
   * Processes security information for the UI.
   */
  [processSecurity](): void;

  /**
   * Appends a list of parameters to the list of rendered parameters
   */
  [appendToParams](list: ApiParameter[], source: string): void;

  /**
   * A handler for the change event dispatched by the `raw` editor.
   */
  [rawBodyChangeHandler](e: Event): void;

  /**
   * A handler for the change event dispatched by the 
   * `urlEncode` editor.
   * Updated the local value, model, and notifies the change.
   */
  [modelBodyEditorChangeHandler](e: Event): void;
  [authSelectorHandler](e: Event): void;

  /**
   * Computes the list of servers to be rendered by this operation.
   * This should be called after the `[processEndpoint]()` function, when the 
   * endpoint model is set.
   */
  [processServers](): void;

  /**
   * @returns AMF graph model for an operation
   */
  [computeMethodAmfModel](model: AmfDocument, selected: string): Operation|undefined;

  /**
   * Handles send button click.
   * Depending on authorization validity it either sends the
   * request or forces authorization and sends the request.
   */
  [sendHandler](): void;

  /**
   * To be called when the user want to execute the request but
   * authorization is invalid (missing values).
   * This function brings the auth panel to front and displays error toast
   *
   * TODO: There is a case when the user didn't requested OAuth2 token
   * but provided all the data. This function should check for this
   * condition and call authorization function automatically.
   */
  authAndExecute(): Promise<void>;

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
  execute(): void;

  /**
   * Sends the `abort-api-request` custom event to cancel the request.
   * Calling this method before sending request may have unexpected
   * behavior because `requestId` is only set with `execute()` method.
   */
  abort(): void;

  /**
   * Event handler for abort click.
   */
  [abortHandler](): void;

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
   */
  serialize(): ApiConsoleRequest;

  /**
   * Handler for the `api-response` custom event.
   * Clears the loading state.
   */
  [responseHandler](e: CustomEvent): void;

  /**
   * Handler for the `oauth2-redirect-uri-changed` custom event. Changes
   * the `redirectUri` property.
   */
  [authRedirectChangedHandler](e: CustomEvent): void;

  /**
   * Handle event for populating annotated fields in the editor.
   */
  [populateAnnotatedFieldsHandler](e: CustomEvent): void;

  /**
   * Computes a current server value for selection made in the server selector.
   */
  [updateServer](): void;

  /**
   * Handler for the change dispatched from the server selector.
   */
  [serverCountHandler](e: CustomEvent): void;

  /**
   * Handler for the change dispatched from the server selector.
   */
  [serverHandler](e: CustomEvent): void;

  /**
   * Computes a regexp for the base URI defined in the server to process URL input change
   * and set the `[urlSearchRegexpValue]` value.
   * This should be computed only when a server and en endpoint change.
   */
  [computeUrlRegexp](): void;
  [mediaTypeSelectHandler](e: Event): void;

  /**
   * Toggles optional parameter groups.
   */
  [optionalToggleHandler](e: Event): void;

  /**
   * When enabled it adds a new custom parameter to the request section defined in the source button.
   */
  [addCustomHandler](e: Event): void;

  /**
   * Updates path/query model from user input.
   *
   * @param e The change event
   */
  [urlEditorChangeHandler](e: Event): void;

  /**
   * Sets the value of `[urlInvalidValue]` and therefore `urlInvalid` properties.
   */
  [validateUrl](): void;

  /**
   * Validates the current URL value.
   * @returns True when the current URL is a valid URL.
   */
  [readUrlValidity](): boolean;

  /**
   * Reads the ordered list of path parameters from the server and the endpoint.
   */
  [getOrderedPathParams](): OperationParameter[];

  /**
   * Applies values from the `values` array to the uri parameters which names are in the `names` array.
   * Both lists are ordered list of parameters.
   *
   * @param values Values for the parameters
   * @param params List of path parameters.
   * @returns True when any parameter was changed.
   */
  [applyUriValues](values: string[], params: OperationParameter[]): boolean;

  /**
   * Applies query parameters values to the render list.
   *
   * @returns True when any parameter was changed.
   */
  [applyQueryParamsValues](map: Record<string, string|string[]>): boolean;

  render(): TemplateResult;

  /**
   * @return {} Template for the request URL label.
   */
  [urlLabelTemplate](): TemplateResult|string;

  /**
   * @returns {TemplateResult} The template for the security drop down selector.
   */
  [authorizationSelectorTemplate](security: SecuritySelectorListItem[], selected: number): TemplateResult;

  /**
   * @returns {TemplateResult} The template for the security drop down selector list item.
   */
  [authorizationSelectorItemTemplate](info: SecuritySelectorListItem): TemplateResult;

  [formActionsTemplate](): TemplateResult;

  /**
   * Creates a template for the "abort" button.
   *
   * @return {TemplateResult}
   */
  [abortButtonTemplate](): TemplateResult;

  /**
   * Creates a template for the "send" or "auth and send" button.
   *
   * @return {TemplateResult}
   */
  [sendButtonTemplate](): TemplateResult;

  /**
   * @return {TemplateResult} A template for the server selector
   */
  [serverSelectorTemplate](): TemplateResult;

  [parametersTemplate](): TemplateResult;

  [headersTemplate](): TemplateResult|string;

  /**
   * @param {string} type
   * @returns {TemplateResult} The template for the add custom parameter button
   */
  [addCustomButtonTemplate](type): TemplateResult;

  /**
   * @return {TemplateResult|string} The template for the payload's mime type selector.
   */
  [mediaTypeSelectorTemplate](): TemplateResult|string;

  /**
   * @returns {TemplateResult|string} The template for the body editor. 
   */
  [bodyTemplate](): TemplateResult|string;

  /**
   * @param {any} info
   * @param {string} id
   * @returns {TemplateResult} The template for the editor that specializes in the URL encoded form data
   */
  [formDataEditorTemplate](info, id): TemplateResult;

  /**
   * @param {any} info
   * @param {string} id
   * @returns {TemplateResult} The template for the editor that specializes in the multipart form data
   */
  [multipartEditorTemplate](info, id): TemplateResult;

  /**
   * @param {any} info
   * @param {string} id
   * @param {string} mimeType
   * @returns {TemplateResult} The template for the editor that specializes in any text data
   */
  [rawEditorTemplate](info, id, mimeType): TemplateResult;

  /**
   * @param {string} target The name of the target parameter group.
   * @param {OperationParameter[]} params The list of parameters. When all are required or empty it won't render then button.
   * @returns {TemplateResult|string} Template for the switch button to toggle visibility of the optional items.
   */
  [toggleOptionalTemplate](target, params): TemplateResult|string;

  /**
   * @returns {TemplateResult|string} A template for the URL editor.
   */
  [urlEditorTemplate](): TemplateResult|string;
}
