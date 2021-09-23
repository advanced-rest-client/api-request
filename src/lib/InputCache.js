/* eslint-disable no-param-reassign */

/**
 * A cache of provided by the user values to the input fields.
 * This is used to restore data when the user switches between different operations.
 * @type {Map<string, any>}
 */
export const globalValues = new Map();
/**
 * A cache for "local" values cached per instance of the component.
 *
 * @type {WeakMap<HTMLElement, Map<string, any>>}
 */
export const localValues = new WeakMap();

/**
 * @param {HTMLElement} element
 * @param {boolean} globalCache Whether to use the global cache.
 * @returns {Map<string, any>}
 */
export function getStore(element, globalCache) {
  if (globalCache) {
    return globalValues;
  }
  return localValues.get(element);
}

/**
 * @param {HTMLElement} element
 * @param {string} key The key to use
 * @param {boolean} globalCache Whether to use the global cache.
 * @returns {any}
 */
export function get(element, key, globalCache) {
  const store = getStore(element, globalCache);
  if (store && store.has(key)) {
    return store.get(key);
  }
  return undefined;
}

/**
 * @param {HTMLElement} element
 * @param {string} key The key to use
 * @param {any} value The value to store
 * @param {boolean} globalCache Whether to use the global cache.
 * @param {boolean=} isArray Whether the value is an array.
 * @param {number=} index The array index.
 */
export function set(element, key, value, globalCache, isArray, index) {
  const store = getStore(element, globalCache);
  if (isArray) {
    if (!store.has(key)) {
      store.set(key, []);
    }
    if (typeof index === "number" && !Number.isNaN(index)) {
      store.get(key)[index] = value;
    } else {
      store.get(key).push(value);
    }
  } else {
    store.set(key, value);
  }
}

/**
 * @param {HTMLElement} element
 * @param {string} key The key to use
 * @param {boolean} globalCache Whether to use the global cache.
 * @returns {boolean}
 */
export function has(element, key, globalCache) {
  const store = getStore(element, globalCache);
  return store.has(key);
}

/**
 * @param {HTMLElement} element
 */
export function registerLocal(element) {
  localValues.set(element, new Map());
}

/**
 * @param {HTMLElement} element
 */
export function unregisterLocal(element) {
  localValues.delete(element);
}

/**
 * @param {HTMLElement} element
 * @param {string} key The key to use
 * @param {boolean} globalCache Whether to use the global cache.
 * @param {number=} index When set to a number it expects the value to be array and removes an item on the specified index.
 */
export function remove(element, key, globalCache, index) {
  const store = getStore(element, globalCache);
  if (typeof index === "number" && !Number.isNaN(index)) {
    const value = /** @type any[] */ (store.get(key));
    if (Array.isArray(value)) {
      value.splice(index, 1);
    }
  } else {
    store.delete(key);
  }
}
