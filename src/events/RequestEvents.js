/* eslint-disable max-classes-per-file */
import { EventTypes } from './EventTypes.js';

/** @typedef {import('../types').ApiConsoleRequest} ApiConsoleRequest */
/** @typedef {import('../types').ApiConsoleResponse} ApiConsoleResponse */
/** @typedef {import('../types').AbortRequestEventDetail} AbortRequestEventDetail */

/**
 * The event dispatched to transport request from the api request editor.
 */
export class ApiRequestEvent extends CustomEvent {
  /**
   * @param {string} type The event type.
   * @param {ApiConsoleRequest} request The request to transport
   */
  constructor(type, request) {
    super(type, {
      bubbles: true,
      composed: true,
      detail: request,
    });
  }
}

/**
 * The event dispatched when response is ready.
 */
export class ApiResponseEvent extends CustomEvent {
  /**
   * @param {string} type The event type.
   * @param {ApiConsoleResponse} response The request to transport
   */
  constructor(type, response) {
    super(type, {
      bubbles: true,
      composed: true,
      detail: response,
    });
  }
}

/**
 * The event dispatched when cancelling ongoing HTTP request.
 */
export class AbortRequestEvent extends CustomEvent {
  /**
   * @param {string} type The event type.
   * @param {AbortRequestEventDetail} detail
   */
  constructor(type, detail) {
    super(type, {
      bubbles: true,
      composed: true,
      detail,
    });
  }
}

export const RequestEvents = {
  /** 
   * @param {EventTarget} target The node on which to dispatch the event.
   * @param {ApiConsoleRequest} request The request to transport
   * @returns {void}
   */
  apiRequest: (target, request) => {
    const e = new ApiRequestEvent(EventTypes.Request.apiRequest, request);
    target.dispatchEvent(e);
  },
  /** 
   * @param {EventTarget} target The node on which to dispatch the event.
   * @param {ApiConsoleRequest} request The request to transport
   * @returns {void}
   */
  apiRequestLegacy: (target, request) => {
    const e = new ApiRequestEvent(EventTypes.Request.apiRequestLegacy, request);
    target.dispatchEvent(e);
  },
  /** 
   * @param {EventTarget} target The node on which to dispatch the event.
   * @param {AbortRequestEventDetail} detail
   * @returns {void}
   */
  abortApiRequest: (target, detail) => {
    const e = new AbortRequestEvent(EventTypes.Request.abortApiRequest, detail);
    target.dispatchEvent(e);
  },
  /** 
   * @param {EventTarget} target The node on which to dispatch the event.
   * @param {AbortRequestEventDetail} detail
   * @returns {void}
   */
  abortApiRequestLegacy: (target, detail) => {
    const e = new AbortRequestEvent(EventTypes.Request.abortApiRequestLegacy, detail);
    target.dispatchEvent(e);
  },
  /** 
   * @param {EventTarget} target The node on which to dispatch the event.
   * @param {ApiConsoleResponse} response
   * @returns {void}
   */
  apiResponse: (target, response) => {
    const e = new ApiResponseEvent(EventTypes.Request.apiResponse, response);
    target.dispatchEvent(e);
  },
  /** 
   * @param {EventTarget} target The node on which to dispatch the event.
   * @param {ApiConsoleResponse} response
   * @returns {void}
   */
  apiResponseLegacy: (target, response) => {
    const e = new ApiResponseEvent(EventTypes.Request.apiResponseLegacy, response);
    target.dispatchEvent(e);
  },
}
