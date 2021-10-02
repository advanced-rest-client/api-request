import { HTTPRequest, RequestAuthorization } from '@advanced-rest-client/arc-types/src/request/ArcRequest';
import { ApiParameter, ApiShapeUnion, ApiSecurityRequirement, ApiServer, ApiEndPoint } from '@api-components/amf-helper-mixin';
import { XhrSimpleRequestTransportElement } from './elements/XhrSimpleRequestTransportElement';

export declare interface ApiConsoleRequest extends HTTPRequest {
  /**
   * The authorization settings.
   * Some of them are already applied to the request object.
   */
  authorization?: RequestAuthorization[];
  /**
   * The id of the request generated when the Api request event is dispatched.
   */
  id?: string;
  /**
   * Whether or not to send credentials on the request. Default is false.
   */
  withCredentials?: boolean;
  /**
   * Timeout for request, in milliseconds.
   */
  timeout?: number;
}

export declare interface ApiConsoleResponse {
  /**
   * The id of the request generated when the Api request event is dispatched.
   */
  id: string;
  isError: boolean;
  request: ApiConsoleRequest;
  response: ApiConsoleHTTPResponse;
  error?: Error;
  loadingTime: number;
}

export declare interface AbortRequestEventDetail {
  /**
   * The URL of the request
   */
  url: string,
  /**
   * The id of the request.
   */
  id: string;
}

export declare interface ApiConsoleHTTPResponse {
  status: number;
  statusText?: string;
  payload?: any;
  headers?: string;
}

export declare interface XHRQueueItem {
  startTime: number;
  request: ApiConsoleRequest;
  xhr: XhrSimpleRequestTransportElement;
}

export declare interface PopulationInfo {
  annotationName: string;
  annotationValue: string;
  fieldValue: string;
}

export interface OperationParameter {
  /**
   * Works with the `allowDisableParams` configuration. By default 
   * a parameter is always enabled regardless of this value.
   * When the `allowDisableParams` is set it uses this value to ignore some parameters (even the required ones).
   */
  enabled?: boolean;
  /**
   * The parameter definition transformed from the AMF graph model.
   * This is set for path, query, and header parameters.
   */
  parameter: ApiParameter;
  /**
   * The schema associated with the parameter. Determines the shape of the user input control.
   */
  schema?: ApiShapeUnion;
  /**
   * Link to `parameter.id`.
   */
  paramId: string;
  /**
   * Link to `schema.id`.
   */
  schemaId?: string;
  /**
   * The value of the binding. Determines where the control should be rendered (parameters or headers).
   */
  binding: string;
  /**
   * A property set to determine from where the object came from. Used internally in the code.
   */
  source: string;
}

export interface SecuritySelectorListItem {
  types: string[];
  labels: string[];
  security: ApiSecurityRequirement;
}

export interface ParameterRenderOptions {
  /**
   * When set it overrides the parameter's / schema's required property
   * and renders the input as required.
   * This also forces the renderer to force example value when default is not present.
   */
  required?: boolean;
}

export interface ShapeTemplateOptions extends ParameterRenderOptions {
  nillable?: boolean;
  arrayItem?: boolean;
  index?: number;
  value?: any;
}

export interface ComputeBaseUriOptions {
  /**
   * The API base URI to use. When not set it computes the base URI from the `server` and `protocols`.
   */
  baseUri?: string;
  /**
   * When set it uses the server to determine the base URI.
   * When the `baseUri` is set this value is ignored.
   * When both are missing then the URL computations ignores the base URI part and reads the path only.
   */
  server?: ApiServer;
  /**
   * The endpoint definition used to compute path of the URL.
   * When not set it ignores the path part.
   */
  endpoint?: ApiEndPoint;
  /**
   * The protocols to use with the computation of the URL.
   * When the server has no protocol (http or https) defined on the base URI
   * then these protocols will be used.
   * If in both cases this is missing then the protocol is not included.
   * Note, it adds the protocol only when the base URI is defined (from the server).
   */
  protocols?: string[];
}
