import { ComputeBaseUriOptions } from '../types';

/**
 * Computes the base URI value for the API/endpoint/operation.
 * 
 * @param options The computation options
 * @returns Base uri value. Can be empty string.
 */
export function computeApiBaseUri(options: ComputeBaseUriOptions): string;

/**
 * Computes the base URI value for the API/endpoint/operation.
 * 
 * @param options The computation options
 * @returns Base uri value. Can be empty string.
 */
export function computeEndpointUri(options: ComputeBaseUriOptions): string;

/**
 * @param str A key or value to encode as x-www-form-urlencoded.
 * @param replacePlus When set it replaces `%20` with `+`.
 */
export function wwwFormUrlEncode(str: string, replacePlus: boolean): string;

/**
 * @param url The current URL
 * @param variables The path variables to apply.
 * @param encode Whether to encode parameters.
 */
export function applyUrlVariables(url: string, variables: Record<string, any>, encode: boolean): string;

/**
 * @param url The current URL
 * @param params The query parameters to apply.
 * @param encode Whether to encode parameters.
 */
export function applyUrlParameters(url: string, params: Record<string, any>, encode: boolean): string;

/**
 * Applies query parameter values to an object.
 * Repeated parameters will have array value instead of string value.
 *
 * @param param Query parameter value as string. Eg `name=value`
 * @param obj Target for values
 */
export function applyQueryParamStringToObject(param: string, obj: Record<string, string|string[]>): void;
