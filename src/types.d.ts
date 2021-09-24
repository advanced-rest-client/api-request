import { HTTPRequest, RequestAuthorization } from '@advanced-rest-client/arc-types/src/request/ArcRequest';
import { ApiParameter, ApiShapeUnion, ApiSecurityRequirement } from '@api-components/amf-helper-mixin';
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
  parameter: ApiParameter;
  schema?: ApiShapeUnion;
  paramId: string;
  schemaId?: string;
  binding: string;
  source: string;
}

export interface ShapeTemplateOptions {
  nillable?: boolean;
  arrayItem?: boolean;
  index?: number;
  value?: any;
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
