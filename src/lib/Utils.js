/** @typedef {import('@api-components/amf-helper-mixin').ApiParameter} ApiParameter */
/** @typedef {import('@api-components/amf-helper-mixin').ApiShapeUnion} ApiShapeUnion */

/**
 * @param {ApiParameter} parameter
 * @param {ApiShapeUnion} schema
 * @returns {string} The name to use in the input.
 */
export function readLabelValue(parameter, schema) {
  let label = schema.displayName || parameter.name ||  schema.name;
  const { required } = parameter;
  if (required) {
    label += '*';
  }
  return label;
}
