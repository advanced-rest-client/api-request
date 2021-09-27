/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import { ns } from '@api-components/amf-helper-mixin';
import { ApiSchemaValues } from '@api-components/api-schema';

/** @typedef {import('@api-components/amf-helper-mixin').ApiShapeUnion} ApiShapeUnion */
/** @typedef {import('@api-components/amf-helper-mixin').ApiScalarShape} ApiScalarShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiArrayShape} ApiArrayShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiTupleShape} ApiTupleShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiUnionShape} ApiUnionShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiFileShape} ApiFileShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiSchemaShape} ApiSchemaShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiAnyShape} ApiAnyShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiNodeShape} ApiNodeShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@anypoint-web-components/anypoint-input').SupportedInputTypes} SupportedInputTypes */


/**  
 * @typedef ParametersSerializationReport
 * @property {boolean} valid
 * @property {string[]} invalid
 * @property {Record<string, any>} header
 * @property {Record<string, any>} query
 * @property {Record<string, any>} path
 * @property {Record<string, any>} cookie
 */

/**
 * A utility class with helper functions to process user input according on AMF schema.
 */
export class AmfInputParser {
  /**
   * Generates a report with the request data compiled from the operation input parameters (except for the body)
   * and gathered values.
   * 
   * Note, all parameter values are cast to String as all target locations of these parameters are string values
   * (headers, query parameters, path parameters). The exception here are arrays which are preserved (but with string values).
   * 
   * All optional parameters that have no value or have invalid value ar ignored.
   * 
   * @param {ApiParameter[]} parameters The input parameters for the operation
   * @param {Map<string, any>} values The collected values for all parameters.
   * @param {string[]=} [nillable=[]] The list of parameter ids that are marked as nil values.
   * @param {any=} [defaultNil=null] The nil value to insert when the parameter is in the nillable list.
   * @returns {ParametersSerializationReport}
   */
  static reportRequestInputs(parameters, values, nillable=[], defaultNil=null) {
    const report = /** @type ParametersSerializationReport */ ({
      valid: true,
      invalid: [],
      header: {},
      query: {},
      path: {},
      cookie: {},
    });

    parameters.forEach((param) => {
      const { id, required, schema, binding, name, paramName } = param;
      const parameterName = paramName || name;
      if (!parameterName) {
        return;
      }
      if (!report[binding]) {
        // for custom shapes
        report[binding] = {};
      }
      if (nillable.includes(id)) {
        report[binding][parameterName] = defaultNil;
        return;
      }
      let value = values.get(id);
      const jsType = typeof value;
      if (jsType === 'undefined' && !required) {
        return;
      }
      if (jsType === 'undefined') {
        if (schema && schema.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
          value = ApiSchemaValues.readInputValue(param, /** @type ApiScalarShape */ (schema));
        }
      }
      if (!schema) {
        // without schema we treat it as "any". It generates string values.
        if (Array.isArray(value)) {
          // this is a huge assumption here.
          // Todo: this should be done recursively.
          report[binding][parameterName] = value.map(i => i === undefined ? i : String(i));
        } else {
          const isScalar = jsType !== 'undefined' && jsType !== 'object' && value !== null;
          report[binding][parameterName] = isScalar ? String(value) : value;
        }
      } else {
        const valid = AmfInputParser.addReportItem(report[binding], parameterName, schema, value, required);
        if (!valid) {
          report.valid = false;
          report.invalid.push(id);
        }
      }
    });

    return report;
  }

  /**
   * @param {Record<string, any>} reportGroup
   * @param {string} name
   * @param {ApiShapeUnion} schema
   * @param {any} value
   * @param {boolean} required Whether the parameter is required.
   * @returns {boolean} `true` when the parameter is valid and `false` otherwise.
   */
  static addReportItem(reportGroup, name, schema, value, required) {
    const { types } = schema;
    if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
      return AmfInputParser.addReportScalarItem(reportGroup, name, value, /** @type ApiScalarShape */ (schema), required);
    }
    if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
      return AmfInputParser.addReportArrayItem(reportGroup, name, value, /** @type ApiArrayShape */ (schema), required);
    }
    if (types.includes(ns.aml.vocabularies.shapes.UnionShape)) {
      return AmfInputParser.addReportUnionItem(reportGroup, name, value, /** @type ApiUnionShape */ (schema), required);
    }
    // ignored parameters are valid (from the form POV).
    return true;
  }

  /**
   * @param {Record<string, any>} reportGroup
   * @param {string} name
   * @param {any} value
   * @param {ApiScalarShape} schema
   * @param {boolean=} required Whether the parameter is required.
   * @returns {boolean} `true` when the parameter is valid and `false` otherwise.
   */
  static addReportScalarItem(reportGroup, name, value, schema, required) {
    const type = typeof value;
    const isScalar = type !== 'undefined' && type !== 'object' && value !== null;
    reportGroup[name] = isScalar ? ApiSchemaValues.parseScalarInput(value, schema) : value;
    return !required || !!required && reportGroup[name] !== undefined;
  }

  /**
   * @param {Record<string, any>} reportGroup
   * @param {string} name
   * @param {any} value
   * @param {ApiArrayShape} schema
   * @param {boolean} required Whether the parameter is required.
   * @returns {boolean} `true` when the parameter is valid and `false` otherwise.
   */
  static addReportArrayItem(reportGroup, name, value, schema, required) {
    if (!Array.isArray(reportGroup[name])) {
      reportGroup[name] = [];
    }
    if (!Array.isArray(value)) {
      // the value should be an array.
      return !required;
    }
    const { items } = schema;
    /** @type any[] */ (value).forEach((item) => {
      if (item === undefined) {
        // the UI generates a default input for array items. We now ignore all 
        // items that are undefined. This means the item was added but the user never provided any
        // value.
        return;
      }
      const type = typeof item;
      const isScalar = type !== 'undefined' && type !== 'object' && value !== null;
      if (isScalar) {
        const result = items ? ApiSchemaValues.parseUserInput(item, items) : String(item);
        if (result !== undefined) {
          reportGroup[name].push(result);
        }
      } else {
        reportGroup[name].push(item);
      }
    });
    return !required || !!required && !!reportGroup[name].length;
  }

  /**
   * @param {Record<string, any>} reportGroup
   * @param {string} name
   * @param {any} value
   * @param {ApiUnionShape} schema
   * @param {boolean} required Whether the parameter is required.
   * @returns {boolean} `true` when the parameter is valid and `false` otherwise.
   */
  static addReportUnionItem(reportGroup, name, value, schema, required) {
    const typed = /** @type ApiUnionShape */ (schema);
    const { anyOf } = typed;
    if (!anyOf || !anyOf.length) {
      return !required;
    }
    const nil = anyOf.find(shape => shape.types.includes(ns.aml.vocabularies.shapes.NilShape));
    if (nil && anyOf.length === 2) {
      // this item is not marked as nil (or we wouldn't get to this line) so use the only schema left.
      const scalar = anyOf.find(shape => shape !== nil);
      return AmfInputParser.addReportScalarItem(reportGroup, name, value, /** @type ApiScalarShape */ (scalar));
    }
    // we are iterating over each schema in the union. Ignoring non-scalar schemas it parses user input
    // for each schema and if the result is set (non-undefined) then this value is used.
    for (let i = 0, len = anyOf.length; i < len; i += 1) {
      const option = anyOf[i];
      if (!option.types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
        continue;
      }
      const result = ApiSchemaValues.parseUserInput(value, option);
      if (result !== undefined) {
        reportGroup[name] = result;
        return true;
      }
    }
    return !required;
  }
}
