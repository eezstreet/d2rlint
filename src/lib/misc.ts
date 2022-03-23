/**
 * Creates a series of sequential numbers as array
 * @param start - the first number in the sequence (inclusive)
 * @param end - the last number in the sequence (exclusive)
 * @returns {number[]} [start, ..., end]
 */
export function seq(start: number, end: number): number[] {
  if (end < start) {
    return seq(end, start);
  }

  const diff = end - start;
  if (diff === 0) {
    return [];
  }

  return Array(diff).fill(0).map((_, i) => i + start);
}

/**
 * Returns true if the specified item is an object
 * @param item - the item to check
 * @returns {item is Record<string, unknown>}
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && item !== undefined && typeof item === "object" &&
    !Array.isArray(item);
}

/**
 * Merges from sources to targets
 * @param target - the target to merge into
 * @param sources - the sources to merge from
 * @returns {T}
 */
export function deepMerge<T>(target: T, ...sources: T[]): T {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return deepMerge(target, ...sources);
}
