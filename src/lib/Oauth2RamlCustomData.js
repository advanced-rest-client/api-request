/* eslint-disable class-methods-use-this */
/** @typedef {import('@api-components/amf-helper-mixin').ApiDataNodeUnion} ApiDataNodeUnion */
/** @typedef {import('@api-components/amf-helper-mixin').ApiScalarNode} ApiScalarNode */
/** @typedef {import('@api-components/amf-helper-mixin').ApiObjectNode} ApiObjectNode */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@api-components/amf-helper-mixin').ApiShapeUnion} ApiShapeUnion */
/** @typedef {import('@api-components/amf-helper-mixin').ApiArrayShape} ApiArrayShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiScalarShape} ApiScalarShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiShape} ApiShape */

import { ns } from '@api-components/amf-helper-mixin';

/**
 * Computes a data model for custom definition for the OAuth 2 scheme
 * According to the annotation published at 
 * https://github.com/raml-org/raml-annotations/tree/master/annotations/security-schemes
 */
export class Oauth2RamlCustomData {
  /**
   * @param {{[key: string]: ApiDataNodeUnion}} properties
   * @returns {ApiParameter[]}
   */
  readParams(properties) {
    const result = [];
    Object.keys(properties).forEach((key) => {
      const definition = properties[key];
      if (definition.types.includes(ns.aml.vocabularies.data.Object)) {
        const property = this.getProperty(/** @type ApiObjectNode */ (definition));
        result.push(property);
      } else if (definition.types.includes(ns.aml.vocabularies.data.Scalar)) {
        const property = this.getPropertyScalar(/** @type ApiScalarNode */ (definition));
        result.push(property);
      }
    });
    return result;
  }

  /**
   * Creates an ApiParameter for an annotation that has properties.
   * This expects the properties to be defined like RAML's type definition.
   * 
   * @param {ApiObjectNode} definition
   * @returns {ApiParameter}
   */
  getProperty(definition) {
    const { properties={}, id, name } = definition;
    const result = /** @type ApiParameter */ ({
      id,
      name,
      examples: [],
      payloads: [],
      types: [ns.aml.vocabularies.apiContract.Parameter],
    });
    const schema = this.readSchema(definition);
    if (schema) {
      result.schema = schema;
    }
    if (properties.required) {
      const req = /** @type ApiScalarNode */ (properties.required);
      result.required = req.value === 'true';
    }
    return result;
  }

  /**
   * Creates an ApiParameter for an annotation that has no properties but rather a simplified
   * notation of `propertyName: dataType`.
   * 
   * @param {ApiScalarNode} definition
   * @returns {ApiParameter}
   */
  getPropertyScalar(definition) {
    const { dataType, id, name } = definition;
    const result = /** @type ApiParameter */ ({
      id,
      name,
      examples: [],
      payloads: [],
      types: [ns.aml.vocabularies.apiContract.Parameter],
    });
    const schema = /** @type ApiScalarShape */ (this.createSchema());
    schema.types = [ns.aml.vocabularies.shapes.ScalarShape];
    schema.id = id;
    schema.name = name;
    schema.dataType = this.typeToSchemaType(dataType);
    result.schema = schema;
    return result;
  }

  /**
   * @param {ApiObjectNode} property
   * @returns {ApiShapeUnion}
   */
  readSchema(property) {
    const { properties={}, name, id } = property;
    // const { example, examples, } = properties;
    const isArray = this.readIsSchemaArray(/** @type ApiScalarNode */ (properties.type), /** @type ApiScalarNode */ (properties.items));
    const type = this.readSchemaType(/** @type ApiScalarNode */ (properties.type), /** @type ApiScalarNode */ (properties.items));
    /** @type ApiShapeUnion */
    let schema;
    if (isArray) {
      const s = /** @type ApiArrayShape */ (this.createSchema());
      s.types = [ns.aml.vocabularies.shapes.ArrayShape];
      s.id = id;
      s.name = name;
      s.items = this.createTypedSchema(type, property);
      schema = s;
    } else {
      schema = this.createTypedSchema(type, property);
    }
    return schema;
  }

  /**
   * @param {string} type
   * @param {ApiObjectNode} object
   * @returns {ApiShapeUnion} 
   */
  createTypedSchema(type, object) {
    switch (type) {
      case 'string':
      case 'number':
      case 'integer':
      case 'float':
      case 'double':
      case 'long':
      case 'date-only':
      case 'date-time':
      case 'time-only':
      case 'nil':
      case 'date':
      case 'boolean': return this.createScalarSchema(object, type);
      default: return undefined;
    }
  }

  /**
   * @returns {ApiShape} 
   */
  createSchema() {
    return /** @type ApiShape */ ({
      id: '',
      types: [],
      and: [],
      examples: [],
      name: '',
      inherits: [],
      or: [],
      values: [],
      xone: [],
      customDomainProperties: [],
    });
  }

  /**
   * @param {ApiObjectNode} object
   * @param {string} type
   * @returns {ApiScalarShape}
   */
  createScalarSchema(object, type) {
    const { properties={}, name, id } = object;
    const schema = /** @type ApiScalarShape */ (this.createSchema());
    schema.types = [ns.aml.vocabularies.shapes.ScalarShape];
    schema.id = id;
    schema.name = name;
    schema.dataType = this.typeToSchemaType(type);
    if (properties.format) {
      const item = /** @type ApiScalarNode */ (properties.format);
      schema.format = item.value;
    }
    if (properties.default) {
      const item = /** @type ApiScalarNode */ (properties.default);
      schema.defaultValueStr = item.value;
      // schema.defaultValue = item.value;
    }
    if (properties.description) {
      const item = /** @type ApiScalarNode */ (properties.description);
      schema.description = item.value;
    }
    if (properties.displayName) {
      const item = /** @type ApiScalarNode */ (properties.displayName);
      schema.displayName = item.value;
    }
    if (properties.pattern) {
      const item = /** @type ApiScalarNode */ (properties.pattern);
      schema.pattern = item.value;
    }
    if (properties.maximum) {
      const item = /** @type ApiScalarNode */ (properties.maximum);
      const value = Number(item.value);
      if (!Number.isNaN(value)) {
        schema.maximum = value;
      }
    }
    if (properties.minimum) {
      const item = /** @type ApiScalarNode */ (properties.minimum);
      const value = Number(item.value);
      if (!Number.isNaN(value)) {
        schema.minimum = value;
      }
    }
    if (properties.multipleOf) {
      const item = /** @type ApiScalarNode */ (properties.multipleOf);
      const value = Number(item.value);
      if (!Number.isNaN(value)) {
        schema.multipleOf = value;
      }
    }
    if (properties.maxLength) {
      const item = /** @type ApiScalarNode */ (properties.maxLength);
      const value = Number(item.value);
      if (!Number.isNaN(value)) {
        schema.maxLength = value;
      }
    }
    if (properties.minLength) {
      const item = /** @type ApiScalarNode */ (properties.minLength);
      const value = Number(item.value);
      if (!Number.isNaN(value)) {
        schema.minLength = value;
      }
    }
    return schema;
  }

  /**
   * @param {ApiScalarNode} object
   * @param {ApiScalarNode=} items The definition of the `items` property that corresponds to RAML's items property of an array
   * @returns {string}
   */
  readSchemaType(object, items) {
    if (object.dataType !== ns.w3.xmlSchema.string) {
      return ns.w3.xmlSchema.string;
    }
    let inputType = object.value || '';
    if (inputType.endsWith('[]')) {
      inputType = inputType.replace('[]', '');
    }
    if (inputType === 'array' && items) {
      return this.readSchemaType(items);
    }
    return inputType || 'string';
    
  }

  /**
   * @param {string} type
   * @returns {string} 
   */
  typeToSchemaType(type) {
    switch (type) {
      case 'boolean': return ns.w3.xmlSchema.boolean;
      case 'number': return ns.w3.xmlSchema.number;
      case 'integer': return ns.w3.xmlSchema.integer;
      case 'float': return ns.w3.xmlSchema.float;
      case 'double': return ns.w3.xmlSchema.double;
      case 'long': return ns.w3.xmlSchema.long;
      case 'date-only': return ns.w3.xmlSchema.date;
      case 'date-time': return ns.w3.xmlSchema.dateTime;
      case 'time-only': return ns.w3.xmlSchema.time;
      case 'nil': return ns.w3.xmlSchema.nil;
      default: return ns.w3.xmlSchema.string;
    }
  }

  /**
   * Checks whether the custom property represents an array.
   * @param {ApiScalarNode} type
   * @param {ApiScalarNode} items The definition of the `items` property that corresponds to RAML's items property of an array
   * @returns {boolean} True when the schema is an array.
   */
  readIsSchemaArray(type, items) {
    if (!type && items) {
      return true;
    }
    if (!type) {
      return false;
    }
    const inputType = type.value || '';
    if (inputType.endsWith('[]') || inputType === 'array') {
      return true;
    }
    return false;
  }
}
