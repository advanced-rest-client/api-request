/* eslint-disable no-continue */
import { ArcHeaders } from '@advanced-rest-client/arc-headers';
import { UrlParser } from '@advanced-rest-client/arc-url';
import { 
  normalizeType,
  METHOD_OAUTH2,
  // METHOD_OAUTH1,
  METHOD_BASIC,
  METHOD_BEARER,
  METHOD_OIDC,
} from "@advanced-rest-client/authorization/src/Utils.js";
import {
  METHOD_CUSTOM,
  METHOD_PASS_THROUGH,
  METHOD_API_KEY,
} from '../elements/ApiAuthorizationMethodElement.js';

/** @typedef {import('@api-components/amf-helper-mixin').ApiSecurityRequirement} ApiSecurityRequirement */
/** @typedef {import('@advanced-rest-client/arc-types').ArcRequest.RequestAuthorization} RequestAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BasicAuthorization} BasicAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth2Authorization} OAuth2Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OAuth1Authorization} OAuth1Authorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.BearerAuthorization} BearerAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.OidcAuthorization} OidcAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.RamlCustomAuthorization} RamlCustomAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.ApiKeyAuthorization} ApiKeyAuthorization */
/** @typedef {import('@advanced-rest-client/arc-types').Authorization.PassThroughAuthorization} PassThroughAuthorization */
/** @typedef {import('../types').SecuritySelectorListItem} SecuritySelectorListItem */
/** @typedef {import('../types').ApiConsoleRequest} ApiConsoleRequest */

/**
 * Applies a map of query parameters to the request object.
 * @param {ApiConsoleRequest} request The request object
 * @param {Record<string, string>} params A map of query parameters to apply to the request
 */
function applyQueryParams(request, params) {
  if (typeof params !== 'object') {
    return;
  }
  const keys = Object.keys(params);
  if (!keys.length) {
    return;
  }
  const parser = new UrlParser(request.url);
  const sParams = parser.searchParams;
  keys.forEach((name) => {
    const value = params[name];
    const index = sParams.findIndex((item) => item[0] === name);
    if (index !== -1) {
      sParams.splice(index, 1);
    }
    sParams.push([name, value]);
  });
  parser.searchParams = sParams;
  request.url = parser.toString();
}

/**
 * Applies a map of headers to the request object.
 * @param {ApiConsoleRequest} request The request object
 * @param {Record<string, string>} headers A map of headers to apply to the request
 */
function applyHeaders(request, headers) {
  if (typeof headers !== 'object') {
    return;
  }
  const keys = Object.keys(headers);
  if (!keys.length) {
    return;
  }
  const parser = new ArcHeaders(request.headers || '');
  keys.forEach((name) => {
    const value = headers[name];
    parser.append(name, value);
  });
  request.headers = parser.toString();
}

export class SecurityProcessor {
  /**
   * @param {ApiSecurityRequirement[]} security
   * @returns {SecuritySelectorListItem[]}
   */
  static readSecurityList(security) {
    const result = /** @type SecuritySelectorListItem[] */ ([]);
    if (!Array.isArray(security) || !security.length) {
      return result;
    }
    security.forEach((item) => {
      const { schemes } = item;
      if (!Array.isArray(schemes)) {
        return;
      }
      result.push(SecurityProcessor.readSecurityListItem(item));
    });
    return result;
  }

  /**
   * @param {ApiSecurityRequirement} item
   * @returns {SecuritySelectorListItem}
   */
  static readSecurityListItem(item) {
    const { schemes } = item;
    const result = /** @type SecuritySelectorListItem */ ({
      types: [],
      labels: [],
      security: item,
    });
    schemes.forEach((scheme) => {
      const { name, scheme: settings } = scheme;
      if (name === 'null') {
        // RAML allows to define a "null" scheme. This means that the authorization
        // for this endpoint is optional.
        result.types.push(undefined);
        result.labels.push('No authorization');
        return;
      }
      const label = name || settings && settings.name;
      const type = settings && settings.type;
      result.types.push(type);
      result.labels.push(label);
    });
    return result;
  }

  /**
   * @param {ApiConsoleRequest} request
   * @param {RequestAuthorization[]} authorization
   */
  static applyAuthorization(request, authorization) {
    if (!Array.isArray(authorization) || !authorization.length) {
      return;
    }

    for (const auth of authorization) {
      if (!auth.enabled || !auth.config) {
        continue;
      }
      switch (normalizeType(auth.type)) {
        case METHOD_BASIC: 
          SecurityProcessor.applyBasicAuth(request, /** @type BasicAuthorization */ (auth.config));
          auth.enabled = false; 
          break;
        case METHOD_OAUTH2: 
          SecurityProcessor.applyOAuth2(request, /** @type OAuth2Authorization */ (auth.config)); 
          auth.enabled = false;
          break;
        case METHOD_OIDC: 
          SecurityProcessor.applyOpenId(request, /** @type OidcAuthorization */ (auth.config)); 
          auth.enabled = false;
          break;
        case METHOD_BEARER: 
          SecurityProcessor.applyBearer(request, /** @type BearerAuthorization */ (auth.config)); 
          auth.enabled = false;
          break;
        case METHOD_CUSTOM: 
          SecurityProcessor.applyCustomAuth(request, /** @type RamlCustomAuthorization */ (auth.config)); 
          auth.enabled = false;
          break;
        case METHOD_API_KEY: 
          SecurityProcessor.applyApiKeys(request, /** @type ApiKeyAuthorization */ (auth.config)); 
          auth.enabled = false;
          break;
        case METHOD_PASS_THROUGH: 
          SecurityProcessor.applyPassThrough(request, /** @type PassThroughAuthorization */ (auth.config)); 
          auth.enabled = false;
          break;
        // case METHOD_OAUTH1:
        //   SecurityProcessor.applyOAuth1(request, /** @type OAuth1Authorization */ (auth.config)); 
        //   auth.enabled = false;
        //   break;
        default:
      }
    }
  }

  /**
   * Injects basic auth header into the request headers.
   * @param {ApiConsoleRequest} request 
   * @param {BasicAuthorization} config 
   */
  static applyBasicAuth(request, config) {
    const { username, password } = config;
    if (!username) {
      return;
    }
    const value = btoa(`${username}:${password || ''}`);

    const headers = new ArcHeaders(request.headers || '');
    headers.append('authorization', `Basic ${value}`);
    request.headers = headers.toString();
  }

  /**
   * Injects oauth 2 auth header into the request headers.
   * @param {ApiConsoleRequest} request 
   * @param {OAuth2Authorization} config 
   */
  static applyOAuth2(request, config) {
    const { accessToken, tokenType='Bearer', deliveryMethod='header', deliveryName='authorization' } = config;
    if (!accessToken) {
      return;
    }
    const value = `${tokenType} ${accessToken}`;
    if (deliveryMethod === 'header') {
      const headers = new ArcHeaders(request.headers || '');
      headers.append(deliveryName, value);
      request.headers = headers.toString();
    } else if (deliveryMethod === 'query') {
      const { url } = request;
      try {
        const parsed = new URL(url);
        parsed.searchParams.append(deliveryName, value);
        request.url = parsed.toString();
      } catch (e) {
        // ...
      }
    }
  }

  /**
   * Injects OpenID Connect auth header into the request headers.
   * @param {ApiConsoleRequest} request 
   * @param {OidcAuthorization} config 
   */
  static applyOpenId(request, config) {
    const { accessToken } = config;
    if (accessToken) {
      SecurityProcessor.applyOAuth2(request, config);
    }
    // todo - if AT is missing find the current token from the tokens list in the passed configuration.
    // Currently the authorization method UI sets the token when the requests is generated so it's not as much important.
  }

  /**
   * Injects bearer auth header into the request headers.
   * @param {ApiConsoleRequest} request 
   * @param {BearerAuthorization} config 
   */
  static applyBearer(request, config) {
    const { token } = config;
    const value = `Bearer ${token}`;

    const headers = new ArcHeaders(request.headers || '');
    headers.append('authorization', value);
    request.headers = headers.toString();
  }

  /**
   * Injects the RAML custom configuration into the request
   * @param {ApiConsoleRequest} request 
   * @param {RamlCustomAuthorization} config 
   */
  static applyCustomAuth(request, config) {
    const { header, query } = config;
    applyQueryParams(request, query);
    applyHeaders(request, header);
  }

  /**
   * Injects the ApiKey configuration into the request
   * @param {ApiConsoleRequest} request 
   * @param {ApiKeyAuthorization} config 
   */
  static applyApiKeys(request, config) {
    const { header, query, } = config;
    applyQueryParams(request, query);
    applyHeaders(request, header);
  }

  /**
   * Injects the PassThrough configuration into the request
   * @param {ApiConsoleRequest} request 
   * @param {ApiKeyAuthorization} config 
   */
  static applyPassThrough(request, config) {
    const { header, query, } = config;
    applyQueryParams(request, query);
    applyHeaders(request, header);
  }

  /*
  @jarrodek The OAuth1 logic is enclosed in a custom element.
  I don't want to move it to a separate class and maintain to be
  able to apply here OAuth 1. So far we have no usage signs from anyone
  (and it's been years since this logic works here).
  If there's a request from a customer, in the `@advanced-rest-client/authorization`
  module create a class that extracts the logic from the oauth 1 component 
  and sign the request.
  */

  // /**
  //  * Signs the OAuth 1 request.
  //  * @param {ApiConsoleRequest} request 
  //  * @param {OAuth1Authorization} config 
  //  */
  // static applyOAuth1(request, config) {
    // ...
  // }
}
