import { HeadersParser } from '@advanced-rest-client/arc-headers';

/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@api-components/amf-helper-mixin').ApiShapeUnion} ApiShapeUnion */

/**
 * @param {Record<string, any>} params
 * @returns {string}
 */
export function generateHeaders(params) {
  if (typeof params !== 'object') {
    return '';
  }
  const lines = Object.keys(params).map((name) => {
    let value = params[name];
    if (value === undefined) {
      value = '';
    } else if (Array.isArray(value)) {
      value = value.join(',');
    } else {
      value = String(value);
    }
    let result = `${name}: `;
    value = value.split('\n').join(' ');
    result += value;
    return result;
  });
  return lines.join('\n');
}

/**
 * Ensures the headers have content type header.
 * @param {string} headers The generated headers string
 * @param {string} mime The expected by the selected payload media type. If not set then it does nothing.
 */
export function ensureContentType(headers, mime) {
  if (!mime) {
    return headers;
  }
  const list = HeadersParser.toJSON(headers);
  const current = HeadersParser.contentType(list);
  if (!current && mime) {
    list.push({ name: 'content-type', value: mime, enabled: true });
  }
  return HeadersParser.toString(list);
}

/**
 * @param {ApiParameter} parameter
 * @param {ApiShapeUnion} schema
 * @returns {string} The name to use in the input.
 */
export function readLabelValue(parameter, schema) {
  let label = parameter.paramName || schema.displayName || parameter.name ||  schema.name;
  const { required } = parameter;
  if (required) {
    label += '*';
  }
  return label;
}
