import { ApiConsoleRequest, ApiConsoleResponse, AbortRequestEventDetail } from '../types';

/**
 * The event dispatched to transport request from the api request editor.
 */
export class ApiRequestEvent extends CustomEvent<ApiConsoleRequest> {
  /**
   * @param type The event type.
   * @param request The request to transport
   */
  constructor(type: string, request: ApiConsoleRequest);
}

/**
 * The event dispatched when response is ready.
 */
export class ApiResponseEvent extends CustomEvent<ApiConsoleResponse> {
  /**
   * @param type The event type.
   * @param request The request to transport
   */
  constructor(type: string, request: ApiConsoleResponse);
}

/**
 * The event dispatched when cancelling ongoing HTTP request.
 */
export class AbortRequestEvent extends CustomEvent<AbortRequestEventDetail> {
  /**
   * @param type The event type.
   */
  constructor(type: string, detail: AbortRequestEventDetail);
}

interface IRequestEvents {
  /** 
   * @param target The node on which to dispatch the event.
   * @param request The request to transport
   */
  apiRequest(target: EventTarget, request: ApiConsoleRequest): void;
  /** 
   * @param target The node on which to dispatch the event.
   * @param request The request to transport
   */
  apiRequestLegacy(target: EventTarget, request: ApiConsoleRequest): void;
  /** 
   * @param target The node on which to dispatch the event.
   */
  abortApiRequest(target: EventTarget, detail: AbortRequestEventDetail): void;
  /** 
   * @param target The node on which to dispatch the event.
   */
  abortApiRequestLegacy(target: EventTarget, detail: AbortRequestEventDetail): void;
  /** 
   * @param target The node on which to dispatch the event.
   */
  apiResponse(target: EventTarget, response: ApiConsoleResponse): void;
  /** 
   * @param target The node on which to dispatch the event.
   */
  apiResponseLegacy(target: EventTarget, response: ApiConsoleResponse): void;
}

export const RequestEvents: IRequestEvents;
