/* eslint-disable class-methods-use-this */
/* eslint-disable arrow-body-style */
// eslint-disable-next-line no-unused-vars
import { LitElement, html } from 'lit-element';
import { dedupeMixin } from '@open-wc/dedupe-mixin';
import { ns } from '@api-components/amf-helper-mixin';
import { ApiSchemaValues } from '@api-components/api-schema';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import { ifDefined } from 'lit-html/directives/if-defined.js'
import * as InputCache from './InputCache.js';
import { readLabelValue } from './Utils.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@api-components/amf-helper-mixin').ApiScalarShape} ApiScalarShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiScalarNode} ApiScalarNode */
/** @typedef {import('@api-components/amf-helper-mixin').ApiShapeUnion} ApiShapeUnion */
/** @typedef {import('@api-components/amf-helper-mixin').ApiUnionShape} ApiUnionShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiArrayShape} ApiArrayShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiTupleShape} ApiTupleShape */
/** @typedef {import('@api-components/amf-helper-mixin').ApiAnyShape} ApiAnyShape */
/** @typedef {import('@anypoint-web-components/anypoint-listbox').AnypointListbox} AnypointListbox */
/** @typedef {import('@anypoint-web-components/anypoint-input').SupportedInputTypes} SupportedInputTypes */
/** @typedef {import('@anypoint-web-components/anypoint-checkbox').AnypointCheckbox} AnypointCheckbox */
/** @typedef {import('../types').OperationParameter} OperationParameter */
/** @typedef {import('../types').ShapeTemplateOptions} ShapeTemplateOptions */

/**
 * @param {any} base
 */
const mxFunction = base => {
  class AmfParameterMixin extends base {
    constructor(init) {
      super(init);
      /** @type {boolean} */
      this.globalCache = undefined;
      /** 
       * @type {OperationParameter[]}
       */
      this.parametersValue = [];
      /**
       * @type {string[]}
       */
      this.nilValues = [];

      this.addArrayValueHandler = this.addArrayValueHandler.bind(this);
      this.paramChangeHandler = this.paramChangeHandler.bind(this);
      this.booleanHandler = this.booleanHandler.bind(this);
      this.deleteParamHandler = this.deleteParamHandler.bind(this);
      this.enumSelectionHandler = this.enumSelectionHandler.bind(this);
      this.nilHandler = this.nilHandler.bind(this);
    }

    /**
     * Clears previously set values in the cache storage.
     */
    clearCache() {
      const params = this.parametersValue;
      (params || []).forEach((param) => {
        InputCache.remove(this.target, param.paramId, this.globalCache)
      });
    }

    /**
     * @param {Event} e
     */
    addArrayValueHandler(e) {
      const button = /** @type HTMLElement */ (e.target);
      const { id } = button.dataset;
      if (!id) {
        return;
      }
      if (!InputCache.has(this.target, id, this.globalCache)) {
        InputCache.set(this.target, id, [], this.globalCache);
      }
      const items = /** @type any[] */ (InputCache.get(this.target, id, this.globalCache));
      items.push(undefined);
      this.requestUpdate();
    }

    /**
     * Reads the value to be set on an input.
     * 
     * @param {ApiParameter} parameter
     * @param {ApiScalarShape} schema
     * @param {boolean=} [isArray=false] Whether the value should be read for an array.
     * @returns {any} The value to set on the input. Note, it is not cast to the type.
     */
    readInputValue(parameter, schema, isArray=false) {
      const { id } = parameter;
      if (InputCache.has(this.target, id, this.globalCache)) {
        return InputCache.get(this.target, id, this.globalCache);
      }
      const opts = {};
      if (parameter.required) {
        opts.fromExamples = true;
      }
      let result;
      if (isArray) {
        result = ApiSchemaValues.readInputValues(parameter, schema, opts);
      } else {
        
        result = ApiSchemaValues.readInputValue(parameter, schema, opts);
      }
      if (result !== undefined) {
        InputCache.set(this.target, id, result, this.globalCache);
      }
      return result;
    }

    /**
     * @param {Event} e
     */
    paramChangeHandler(e) {
      const input = /** @type HTMLInputElement */ (e.target);
      const { value, dataset } = input;
      const { domainId, isArray, index } = dataset;
      if (!domainId) {
        return;
      }
      const param = this.parametersValue.find(p => p.paramId === domainId);
      if (!param) {
        return;
      }
      // sets cached value of the input.
      const typed = ApiSchemaValues.parseUserInput(value, param.schema);
      InputCache.set(this.target, domainId, typed, this.globalCache, isArray === 'true', index ? Number(index) : undefined);
      this.notifyChange();
    }

    /**
     * @param {Event} e
     */
    booleanHandler(e) {
      const input = /** @type AnypointCheckbox */ (e.target);
      const { checked, dataset } = input;
      const { domainId, isArray, index } = dataset;
      if (!domainId) {
        return;
      }
      const param = this.parametersValue.find(p => p.paramId === domainId);
      if (!param) {
        return;
      }
      InputCache.set(this.target, domainId, checked, this.globalCache, isArray === 'true', index ? Number(index) : undefined);
      this.notifyChange();
    }

    /**
     * A handler for the remove param button click.
     * @param {Event} e
     */
    deleteParamHandler(e) {
      const button = /** @type HTMLElement */ (e.currentTarget);
      const { dataset } = button;
      const { domainId, index } = dataset;
      if (!domainId) {
        return;
      }
      if (!InputCache.has(this.target, domainId, this.globalCache)) {
        return;
      }
      InputCache.remove(this.target, domainId, this.globalCache, index ? Number(index) : undefined);
      this.requestUpdate();
      this.notifyChange();
    }

    /**
     * @param {Event} e
     */
    enumSelectionHandler(e) {
      const list = /** @type AnypointListbox */ (e.target);
      const select = /** @type HTMLElement */ (list.parentElement);
      const { domainId, isArray, index } = select.dataset;
      if (!domainId) {
        return;
      }
      const param = this.parametersValue.find(p => p.paramId === domainId);
      if (!param) {
        return;
      }
      const enumValues = /** @type ApiScalarNode[] */ (param.schema.values);
      const { value } = enumValues[list.selected];
      const typed = ApiSchemaValues.parseUserInput(value, param.schema);
      InputCache.set(this.target, domainId, typed, this.globalCache, isArray === 'true', index ? Number(index) : undefined);
      this.notifyChange();
    }

    /**
     * Handler for the nil value toggle.
     * @param {Event} e
     */
    nilHandler(e) {
      const button = /** @type AnypointCheckbox */ (e.target);
      const { checked, dataset } = button;
      const { domainId } = dataset;
      if (!domainId) {
        return;
      }
      const list = this.nilValues;
      const has = list.includes(domainId);
      if (checked && !has) {
        list.push(domainId);
        this.requestUpdate();
      } else if (!checked && has) {
        const index = list.indexOf(domainId);
        list.splice(index, 1);
        this.requestUpdate();
      }
      this.notifyChange();
    }

    /**
     * @param {OperationParameter} param
     * @returns {TemplateResult|string} The template for the request parameter form control.
     */
    parameterTemplate(param) {
      const { schema, parameter } = param;
      if (!schema) {
        return '';
      }
      return this.parameterSchemaTemplate(parameter, schema);
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiShapeUnion} schema
     * @param {ShapeTemplateOptions=} opts
     * @returns {TemplateResult|string} The template for the request parameter form control.
     */
    parameterSchemaTemplate(parameter, schema, opts={}) {
      const { types } = schema;
      if (types.includes(ns.aml.vocabularies.shapes.ScalarShape)) {
        return this.scalarShapeTemplate(parameter, /** @type ApiScalarShape */ (schema), opts);
      }
      if (types.includes(ns.w3.shacl.NodeShape)) {
        return this.nodeShapeTemplate();
      }
      if (types.includes(ns.aml.vocabularies.shapes.UnionShape)) {
        return this.unionShapeTemplate(parameter, /** @type ApiUnionShape */ (schema));
      }
      if (types.includes(ns.aml.vocabularies.shapes.FileShape)) {
        return this.fileShapeTemplate();
      }
      if (types.includes(ns.aml.vocabularies.shapes.SchemaShape)) {
        return this.schemaShapeTemplate();
      }
      if (types.includes(ns.aml.vocabularies.shapes.ArrayShape) || types.includes(ns.aml.vocabularies.shapes.MatrixShape)) {
        return this.arrayShapeTemplate(parameter, /** @type ApiArrayShape */ (schema));
      }
      if (types.includes(ns.aml.vocabularies.shapes.TupleShape)) {
        return this.tupleShapeTemplate(parameter, /** @type ApiTupleShape */ (schema));
      }
      return this.anyShapeTemplate(parameter, /** @type ApiAnyShape */ (schema));
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiScalarShape} schema
     * @param {ShapeTemplateOptions=} opts
     * @returns {TemplateResult|string} The template for the schema parameter.
     */
    scalarShapeTemplate(parameter, schema, opts={}) {
      const { readOnly, values, dataType } = schema;
      if (readOnly) {
        return '';
      }
      if (values && values.length) {
        return this.enumTemplate(parameter, schema, opts);
      }
      const inputType = ApiSchemaValues.readInputType(dataType);
      if (inputType === 'boolean') {
        return this.booleanTemplate(parameter, schema, opts);
      }
      return this.textInputTemplate(parameter, schema, inputType, opts);
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiScalarShape} schema
     * @param {SupportedInputTypes=} type The input type.
     * @param {ShapeTemplateOptions=} opts
     * @return {TemplateResult} A template for an input form item for the given type and schema
     */
    textInputTemplate(parameter, schema, type, opts={}) {
      const { id, binding } = parameter;
      const { pattern, minimum, minLength, maxLength, maximum, multipleOf } = schema;
      const label = readLabelValue(parameter, schema);
      const { required, allowEmptyValue, } = parameter;
      let value;
      if (opts.arrayItem) {
        value = opts.value || '';
      } else {
        value = this.readInputValue(parameter, schema);
      }
      if (value) {
        value = ApiSchemaValues.parseScalarInput(value, schema);
      }
      /** @type number */
      let step;
      if (['time', 'datetime-local'].includes(type)) {
        step = 1;
      } else if (typeof multipleOf !== 'undefined') {
        step = Number(multipleOf);
      }
      const title = parameter.description || schema.description;
      const nillable = this.nilValues;
      const nillDisabled = !!opts.nillable && nillable.includes(id);
      return html`
      <div class="form-item">
        <anypoint-input 
          data-domain-id="${id}"
          data-is-array="${ifDefined(opts.arrayItem)}"
          data-index="${ifDefined(opts.index)}"
          data-binding="${ifDefined(binding)}"
          name="${parameter.name || schema.name}" 
          class="form-input"
          ?required="${required && !allowEmptyValue}"
          ?autoValidate="${required && !allowEmptyValue}"
          .value="${value}"
          .pattern="${pattern}"
          .min="${typeof minimum !== 'undefined' ? String(minimum) : undefined}"
          .minLength="${minLength}"
          .max="${typeof maximum !== 'undefined' ? String(maximum) : undefined}"
          .maxLength="${maxLength}"
          .step="${step}"
          type="${ifDefined(type)}"
          title="${ifDefined(title)}"
          @change="${this.paramChangeHandler}"
          ?disabled="${nillDisabled}"
        >
          <label slot="label">${label}</label>
        </anypoint-input>
        ${opts.nillable ? this.nillInputTemplate(parameter) : ''}
        ${opts.arrayItem ? this.deleteParamTemplate(id, opts.index) : ''}
      </div>
      `;
    }

    /**
     * @param {string} paramId The ApiParameter id.
     * @param {number=} arrayIndex When this is an array item, the index on the array.
     * @returns {TemplateResult} The template for the param remove button. 
     */
    deleteParamTemplate(paramId, arrayIndex) {
      const { anypoint } = this;
      const title = 'Removes this parameter value.';
      return html`
      <anypoint-icon-button 
        ?compatibility="${anypoint}" 
        title="${title}" 
        data-domain-id="${paramId}"
        data-index="${ifDefined(arrayIndex)}"
        @click="${this.deleteParamHandler}"
      >
        <arc-icon icon="removeCircleOutline"></arc-icon>
      </anypoint-icon-button>
      `;
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiScalarShape} schema
     * @param {ShapeTemplateOptions=} opts
     * @returns {TemplateResult|string} The template for the enum input.
     */
    enumTemplate(parameter, schema, opts={}) {
      const { anypoint } = this;
      const label = readLabelValue(parameter, schema);
      const enumValues = /** @type ApiScalarNode[] */ (schema.values || []);
      const selectedValue = this.readInputValue(parameter, schema);
      const selected = enumValues.findIndex(i => i.value === selectedValue);
      const { required, id, binding } = parameter;
      const title = parameter.description || schema.description;
      const nillable = this.nilValues;
      const nillDisabled = !!opts.nillable && nillable.includes(id);
      return html`
      <div class="form-item">
        <anypoint-dropdown-menu
          class="param-selector"
          name="${parameter.name || schema.name}"
          data-binding="${ifDefined(binding)}"
          ?compatibility="${anypoint}"
          ?required="${required}"
          title="${ifDefined(title)}"
          fitPositionTarget
          dynamicAlign
          data-domain-id="${id}"
          data-is-array="${ifDefined(opts.arrayItem)}"
          ?disabled="${nillDisabled}"
        >
          <label slot="label">${label}</label>
          <anypoint-listbox
            slot="dropdown-content"
            ?compatibility="${anypoint}"
            .selected="${selected}"
            @selected="${this.enumSelectionHandler}"
          >
            ${enumValues.map((value) => html`<anypoint-item data-type="${value.dataType}" data-value="${value.value}">${value.value}</anypoint-item>`)}
          </anypoint-listbox>
        </anypoint-dropdown-menu>
        ${opts.nillable ? this.nillInputTemplate(parameter) : ''}
      </div>
      `;
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiScalarShape} schema
     * @param {ShapeTemplateOptions=} opts
     * @returns {TemplateResult|string} The template for the checkbox input.
     */
    booleanTemplate(parameter, schema, opts={}) {
      const label = readLabelValue(parameter, schema);
      const { required, id } = parameter;
      /** @type {boolean} */
      let value;
      if (opts.arrayItem) {
        value = opts.value || '';
      } else {
        value = this.readInputValue(parameter, schema);
      }
      const title = parameter.description || schema.description;
      const nillable = this.nilValues;
      const nillDisabled = !!opts.nillable && nillable.includes(id);
      return html`
      <div class="form-item">
        <anypoint-checkbox 
          name="${parameter.name || schema.name}"
          data-binding="${ifDefined(parameter.binding)}"
          ?required="${required}"
          .checked="${value}"
          title="${ifDefined(title)}"
          data-domain-id="${id}"
          data-is-array="${ifDefined(opts.arrayItem)}"
          ?disabled="${nillDisabled}"
          @change="${this.booleanHandler}"
        >${label}</anypoint-checkbox>
        ${opts.nillable ? this.nillInputTemplate(parameter) : ''}
      </div>
      `;
    }

    /**
     * @param {ApiParameter} parameter
     * @returns {TemplateResult|string} The template for the nil checkbox input.
     */
    nillInputTemplate(parameter) {
      return html`
      <anypoint-checkbox 
        class="nil-option"
        data-domain-id="${parameter.id}"
        data-binding="${ifDefined(parameter.binding)}"
        title="Makes the property nillable (e.g. inserts null into the schema)"
        @change="${this.nilHandler}"
      >Nil</anypoint-checkbox>
      `;
    }

    /**
     * or now we do not support union shapes. There's no way to learn how to serialize
     * the Node shape to a string.
     * @returns {TemplateResult|string} The template for the node shape.
     */
    nodeShapeTemplate() {
      return '';
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiUnionShape} schema
     * @returns {TemplateResult|string} The template for the union shape.
     */
    unionShapeTemplate(parameter, schema) {
      const { anyOf } = schema;
      if (!anyOf || !anyOf.length) {
        return '';
      }
      const nil = anyOf.find(shape => shape.types.includes(ns.aml.vocabularies.shapes.NilShape));
      if (nil && anyOf.length === 2) {
        // this is a case where a scalar is marked as nillable instead of not required
        // (which for some reason is a common practice among RAML developers).
        const scalar = anyOf.find(shape => shape !== nil);
        return this.parameterSchemaTemplate(parameter, scalar, {
          nillable: true,
        });
      }
      const hasComplex = anyOf.some(i => !i.types.includes(ns.aml.vocabularies.shapes.ScalarShape));
      const hasScalar = anyOf.some(i => i.types.includes(ns.aml.vocabularies.shapes.ScalarShape));
      if (hasComplex && !hasScalar) {
        // We quit here as this is the same problem as with the Node shape - unclear how to serialize the types
        return '';
      }
      // at this point only scalars are possible. For that we render a regular text field 
      // and while serializing the values we figure out what type it should be giving the 
      // value provided and available types in the union.
      let opts;
      if (nil) {
        opts = { nillable: true };
      }
      return this.textInputTemplate(parameter, schema, 'text', opts);
    }

    /**
     * This situation makes not sense as there's no mechanism to describe how to 
     * put a file into a path, query, or headers.
     * @returns {TemplateResult|string} The template for the file shape.
     */
    fileShapeTemplate() {
      return '';
    }

    /**
     * For now we do not support union shapes. There's no way to learn how to serialize
     * the Schema shape to a string.
     * @returns {TemplateResult|string} The template for the schema shape.
     */
    schemaShapeTemplate() {
      return '';
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiArrayShape} schema
     * @returns {TemplateResult|string} The template for the array shape.
     */
    arrayShapeTemplate(parameter, schema) {
      const { items } = schema;
      if (!items) {
        return '';
      }
      const { id } = parameter;
      const label = readLabelValue(parameter, schema);
      const values = /** @type any[] */ (this.readInputValue(parameter, schema, true));
      const options = { arrayItem: true, };
      const inputs = values.map((value, index) => this.parameterSchemaTemplate(parameter, items, { ...options, value, index }));
      return html`
      <div class="array-form-item" data-param-id="${id}" data-param-label="${label}">
        <div class="array-title"><span class="label">${label}</span></div>
        ${inputs}
        ${this.addArrayItemTemplate(id)}
      </div>
      `;
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiTupleShape} schema
     * @returns {TemplateResult|string} The template for the tuple shape.
     */
    tupleShapeTemplate(parameter, schema) {
      const { items } = schema;
      if (!items) {
        return '';
      }
      // TODO: not sure how to process this value...
      return '';
    }

    /**
     * @param {ApiParameter} parameter
     * @param {ApiAnyShape} schema
     * @returns {TemplateResult|string} The template for the Any shape.
     */
    anyShapeTemplate(parameter, schema) {
      return this.textInputTemplate(parameter, schema, 'text');
    }

    /**
     * @param {string} id The id of the parameter to add the value to.
     * @returns {TemplateResult} The template for the adding an array item button
     */
    addArrayItemTemplate(id) {
      return html`
      <anypoint-button data-id="${id}" @click="${this.addArrayValueHandler}">Add new value</anypoint-button>
      `;
    }
  }
  return AmfParameterMixin;
}

/**
 * This mixin adds support for rendering operation parameter inputs.
 * It support:
 * - rendering inputs
 * - caching user input
 * - restoring cache input.
 * 
 * @mixin
 */
export const AmfParameterMixin = dedupeMixin(mxFunction);