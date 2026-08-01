import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_DIR = 'data/.cache';

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
}

/**
 * @param {string} name
 * @param {string} [dir]
 * @returns {Record<string, unknown>}
 */
export function readCache(name, dir = DEFAULT_DIR) {
  const path = join(dir, `${name}.json`);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.warn(`Cache file ${path} is unreadable and will be rebuilt.`);
    return {};
  }
}

/**
 * @param {string} name
 * @param {unknown} data
 * @param {string} [dir]
 * @returns {void}
 */
export function writeCache(name, data, dir = DEFAULT_DIR) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.json`), `${JSON.stringify(sortKeys(data), null, 2)}\n`);
}

/**
 * Resolves the fetcher, falling back to previously cached data when the call
 * fails. A failing API degrades to stale figures; only a total absence of data
 * is fatal.
 *
 * @template T
 * @param {string} label
 * @param {() => Promise<T>} fetcher
 * @param {T | undefined} cached
 * @returns {Promise<{ value: T, stale: boolean }>}
 */
export async function withFallback(label, fetcher, cached) {
  try {
    return { value: await fetcher(), stale: false };
  } catch (error) {
    if (cached === undefined) {
      throw new Error(`${label} fetch failed and no cached data is available: ${error.message}`);
    }
    console.warn(`${label} fetch failed, using cached data: ${error.message}`);
    return { value: cached, stale: true };
  }
}
