/**
 * Omit specified keys from an object
 */
export function omit(obj: any, keysToOmit: string[]): any {
  if (!obj || typeof obj !== 'object') return obj;

  const topLevelKeys = new Set<string>();
  const nestedOmits = new Map<string, Set<string>>();

  keysToOmit.forEach(key => {
    if (key.includes('.')) {
      const [parent, ...rest] = key.split('.');
      const nestedKey = rest.join('.');
      if (!nestedOmits.has(parent)) {
        nestedOmits.set(parent, new Set());
      }
      nestedOmits.get(parent)!.add(nestedKey);
    } else {
      topLevelKeys.add(key);
    }
  });

  const result = { ...obj };

  topLevelKeys.forEach(key => {
    delete result[key];
  });

  nestedOmits.forEach((nestedKeys, parent) => {
    if (result[parent]) {
      result[parent] = omit(result[parent], Array.from(nestedKeys));
    }
  });

  return result;
}

/**
 * Omit specified keys from an array of objects
 */
export function omitFromArray(arr: any[], keysToOmit: string[]): any[] {
  return arr.map(item => omit(item, keysToOmit));
}
