import { HTTPRequest } from '@advanced-rest-client/arc-types/src/request/ArcRequest';
import { ApiAuthorizationSettings } from '@api-components/api-authorization/src/types';
import { XhrSimpleRequestTransportElement } from './XhrSimpleRequestTransportElement';

export declare interface ApiConsoleRequest extends HTTPRequest {
  /**
   * The authorization settings.
   * Some of them are already applied to the request object.
   */
  auth?: ApiAuthorizationSettings[];
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
  /**
   * The timestamp when the request was started (before the connection is made)
   */
  startTime?: number;
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
