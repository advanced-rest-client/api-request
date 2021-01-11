import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';

export const AmfLoader = {};

/**
 * @mixes AmfHelperMixin
 */
class HelperElement extends AmfHelperMixin(Object) {}

const helper = new HelperElement();

/**
 * Loads an API from a file located in demo/ folder.
 *
 * @param {Object} opts
 * @param {string} [opts.fileName='demo-api']
 * @param {boolean|string} [opts.compact=false]
 * @return {Promise} Resolved to an API object
 */
AmfLoader.load = async ({ fileName = 'demo-api', compact = false } = {}) => {
  const suffix = compact ? '-compact' : '';
  const file = `${fileName}${suffix}.json`;
  const url = `${window.location.protocol}//${window.location.host}/base/demo/${file}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to download API data model');
  }
  return response.json();
};

/**
 * @param {Object} model
 * @param {String} endpoint
 * @return {Object}
 */
AmfLoader.lookupEndpoint = (model, endpoint) => {
  helper.amf = model;
  const webApi = helper._computeWebApi(model);
  return helper._computeEndpointByPath(webApi, endpoint);
};

/**
 * @param {Object} model
 * @param {String} endpoint
 * @param {String} operation
 * @return {Object}
 */
AmfLoader.lookupOperation = (model, endpoint, operation) => {
  const endPoint = AmfLoader.lookupEndpoint(model, endpoint);
  const opKey = helper._getAmfKey(helper.ns.aml.vocabularies.apiContract.supportedOperation);
  const ops = helper._ensureArray(endPoint[opKey]);
  return ops.find((item) => helper._getValue(item, helper.ns.aml.vocabularies.apiContract.method) === operation);
};
