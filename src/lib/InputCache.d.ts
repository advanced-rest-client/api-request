/**
 * A cache of provided by the user values to the input fields.
 * This is used to restore data when the user switches between different operations.
 */
export const globalValues: Map<string, any>;
/**
 * A cache for "local" values cached per instance of the component.
 */
export const localValues: WeakMap<HTMLElement, Map<string, any>>;

export function getStore(element: HTMLElement, globalCache: boolean): Map<string, any>;

/**
 * Reads a value from the store.
 * @param element
 * @param key The key to use
 * @param globalCache Whether to use the global cache.
 * @returns {any}
 */
export function get(element: HTMLElement, key: string, globalCache: boolean): any;

/**
 * Sets a value in a cache.
 * @param element
 * @param key The key to use
 * @param value The value to store
 * @param globalCache Whether to use the global cache.
 * @param isArray Whether the value is an array.
 * @param index The array index.
 */
export function set(element: HTMLElement, key: string, value: any, globalCache: boolean, isArray?: boolean, index?: number): void;

/**
 * @param element
 * @param key The key to use
 * @param globalCache Whether to use the global cache.
 */
export function has(element: HTMLElement, key: string, globalCache: boolean): boolean;

/**
 * Registers an element in a non-global store.
 */
export function registerLocal(element: HTMLElement): void;

/**
 * Un-registers an element in a non-global store.
 */
export function unregisterLocal(element: HTMLElement): void;

/**
 * Removes a value from the store.
 * @param element
 * @param key The key to use
 * @param globalCache Whether to use the global cache.
 * @param index When set to a number it expects the value to be array and removes an item on the specified index.
 */
export function remove(element: HTMLElement, key: string, globalCache: boolean, index?: number): void;
