import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { readCache, writeCache, withFallback } from './lib/cache.mjs';

/**
 * @typedef {Record<string, { citations: number }>} OpenAlexResult
 */

const API = 'https://api.openalex.org/works';
const BATCH = 40;

const bare = (doi) =>
  String(doi)
    .replace(/^https?:\/\/doi\.org\//i, '')
    .toLowerCase();

/**
 * @param {{ dois: string[], mailto: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<OpenAlexResult>}
 */
export async function fetchOpenAlex({ dois, mailto, fetchImpl = fetch }) {
  const out = {};
  for (let index = 0; index < dois.length; index += BATCH) {
    const chunk = dois.slice(index, index + BATCH);
    const filter = `doi:${chunk.join('|')}`;
    const url =
      `${API}?filter=${encodeURIComponent(filter)}` +
      `&per-page=${BATCH}&mailto=${encodeURIComponent(mailto)}`;
    const response = await fetchImpl(url, { headers: { 'User-Agent': 'cv-site-build' } });
    if (!response.ok) throw new Error(`OpenAlex returned ${response.status}`);
    const body = await response.json();
    for (const work of body.results ?? []) {
      if (!work.doi) continue;
      out[bare(work.doi)] = { citations: work.cited_by_count ?? 0 };
    }
  }
  return out;
}

function doiList() {
  const entries = yaml.load(readFileSync('data/publications.yml', 'utf8'), {
    schema: yaml.CORE_SCHEMA,
  });
  return (entries ?? [])
    .map((entry) => entry.doi)
    .filter(Boolean)
    .map(bare);
}

export async function run() {
  const cached = readCache('openalex');
  const { value, stale } = await withFallback(
    'OpenAlex',
    () => fetchOpenAlex({ dois: doiList(), mailto: 'sanjaysrikakulam@gmail.com' }),
    Object.keys(cached).length ? cached : undefined,
  );
  if (!stale) writeCache('openalex', value);
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
