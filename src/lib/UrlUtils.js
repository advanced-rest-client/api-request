/* eslint-disable no-param-reassign */
/** @typedef {import('@api-components/amf-helper-mixin').ApiEndPoint} ApiEndPoint */
/** @typedef {import('@api-components/amf-helper-mixin').ApiServer} ApiServer */

/**
 * Computes the URL value for the current serves, selected server, and endpoint's path.
 * @param {ApiEndPoint} endpoint
 * @param {ApiServer[]} servers
 * @param {string} serverId
 * @returns {string} The URL template value.
 */
 export function computeEndpointUrlValue(endpoint, servers, serverId) {
  let result = '';
  let server;
  if (Array.isArray(servers) && servers.length) {
    if (serverId) {
      server = servers.find((item) => item.id === serverId);
    } else {
      [server] = servers;
    }
  }
  if (server) {
    result += server.url;
    if (result.endsWith('/')) {
      result = result.substr(0, result.length - 1);
    }
  }
  if (endpoint) {
    let { path='' } = endpoint;
    if (path[0] !== '/') {
      path = `/${path}`;
    }
    result += path;
  }
  if (!result) {
    result = '(unknown path)';
  }
  return result;
}

/**
 * @param {string} str A key or value to encode as x-www-form-urlencoded.
 * @param {boolean} replacePlus When set it replaces `%20` with `+`.
 * @returns {string} .
 */
export function wwwFormUrlEncode(str, replacePlus) {
  // Spec says to normalize newlines to \r\n and replace %20 spaces with +.
  // jQuery does this as well, so this is likely to be widely compatible.
  if (!str) {
    return '';
  }
  let result = encodeURIComponent(str.toString().replace(/\r?\n/g, '\r\n'));
  if (replacePlus) {
    result = result.replace(/%20/g, '+');
  }
  return result;
}

/**
 * Creates a RegExp object to replace template variable from the base string
 * @param {string} name Name of the parameter to be replaced
 * @return {RegExp}
 */
function createUrlReplaceRegex(name) {
  if (name[0] === '+' || name[0] === '#') {
    // eslint-disable-next-line no-param-reassign
    name = `\\${  name}`;
  }
  return new RegExp(`{${name}}`, 'g');
}

/**
 * @param {string} url The current URL
 * @param {Record<string, any>} variables The path variables to apply.
 * @param {boolean} encode Whether to encode parameters.
 */
export function applyUrlVariables(url, variables, encode) {
  let result = url || '';
  Object.keys(variables).forEach((variable) => {
    let value = variables[variable];
    if (value === undefined) {
      return;
    }
    value = String(value);
    if (encode) {
      if (variable[0] === '+' || variable[0] === '#') {
        value = encodeURI(value);
      } else {
        value = wwwFormUrlEncode(value, false);
      }
    }
    const r = createUrlReplaceRegex(variable);
    result = result.replace(r, String(value));
  });
  return result;
}

/**
 * @param {Record<string, any>} params The query parameters to use to generate the query string.
 * @param {boolean} encode Whether to encode query parameters.
 * @returns {string} The query string.
 */
function generateQueryString(params, encode) {
  if (typeof params !== 'object') {
    return '';
  }
  const parts = [];
  /**
   * @param {string} name
   * @param {any} value
   */
  function addPart(name, value) {
    if (value === undefined) {
      value = '';
    } else {
      value = String(value);
    }
    if (encode) {
      name = wwwFormUrlEncode(name, true);
      value = wwwFormUrlEncode(value, true);
    }
    parts.push(`${name}=${value}`);
  }
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach((v) => {
        let arrayValue = v;
        if (Array.isArray(arrayValue)) {
          arrayValue = arrayValue.join(',');
        }
        addPart(key, arrayValue);
      });
    } else {
      addPart(key, value);
    }
  });
  return parts.join('&');
}

/**
 * @param {string} url The current URL
 * @param {Record<string, any>} params The query parameters to apply.
 * @param {boolean} encode Whether to encode parameters.
 */
export function applyUrlParameters(url, params, encode) {
  const query = generateQueryString(params, encode);
  if (!query) {
    return url;
  }
  let result = url || '';
  result += (result.indexOf('?') === -1) ? '?' : '&';
  result += query;
  return result;
}
