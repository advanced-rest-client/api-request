import { AmfHelperMixin, AmfSerializer } from '@api-components/amf-helper-mixin';

/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('@api-components/amf-helper-mixin').EndPoint} EndPoint */
/** @typedef {import('@api-components/amf-helper-mixin').Operation} Operation */
/** @typedef {import('@api-components/amf-helper-mixin').ApiOperation} ApiOperation */

export class AmfLoader extends AmfHelperMixin(Object) {
  /**
   * Reads AMF graph model as string
   * @param {boolean=} [compact='false']
   * @param {string=} [fileName='demo-api']
   * @returns {Promise<AmfDocument>} 
   */
  async getGraph(compact=false, fileName='demo-api') {
    const suffix = compact ? '-compact' : '';
    const file = `${fileName}${suffix}.json`;
    const url = `${window.location.protocol}//${window.location.host}/demo/${file}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Unable to download API data model');
    }
    let result = await  response.json();
    if (Array.isArray(result)) {
      [result] = result;
    }
    return result;
  }

  /**
   * @param {AmfDocument} model
   * @param {string} endpoint
   * @return {EndPoint}
   */
  lookupEndpoint(model, endpoint) {
    this.amf = model;
    const webApi = this._computeWebApi(model);
    return this._computeEndpointByPath(webApi, endpoint);
  }

  /**
   * @param {AmfDocument} model
   * @param {string} endpoint
   * @param {string} operation
   * @return {Operation}
   */
  lookupOperation(model, endpoint, operation) {
    const endPoint = this.lookupEndpoint(model, endpoint);
    const opKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.supportedOperation);
    const ops = this._ensureArray(endPoint[opKey]);
    return ops.find((item) => this._getValue(item, this.ns.aml.vocabularies.apiContract.method) === operation);
  }

  /**
   * @param {AmfDocument} model
   * @param {string} endpoint
   * @param {string} operation
   * @return {ApiOperation}
   */
  getOperation(model, endpoint, operation) {
    const op = this.lookupOperation(model, endpoint, operation);
    if (!op) {
      throw new Error(`Unknown operation for path ${endpoint} and method ${operation}`);
    }
    const serializer = new AmfSerializer(model);
    return serializer.operation(op);
  }
}
