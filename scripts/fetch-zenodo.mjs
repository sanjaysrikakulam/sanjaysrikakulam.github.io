import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { readCache, writeCache, withFallback } from './lib/cache.mjs';

/**
 * @typedef {object} ZenodoRecord
 * @property {number} views
 * @property {number} downloads
 * @property {string | null} resource_type
 * @property {string[]} keywords
 */

/**
 * @typedef {Record<string, ZenodoRecord>} ZenodoResult
 */

const API = 'https://zenodo.org/api/records';

const bare = (doi) =>
  String(doi)
    .replace(/^https?:\/\/doi\.org\//i, '')
    .toLowerCase();

function resourceTitle(metadata) {
  const title = metadata?.resource_type?.title;
  if (!title) return null;
  return typeof title === 'string' ? title : (title.en ?? null);
}

// The current Zenodo API returns keywords as a flat array of strings under
// metadata.keywords. Zenodo is migrating records to InvenioRDM, which instead
// returns metadata.subjects as an array of { subject } objects, so that shape
// is kept as a fallback until the migration is complete.
function resourceKeywords(metadata) {
  const keywords = metadata?.keywords;
  if (Array.isArray(keywords) && keywords.length) {
    return keywords.filter((k) => typeof k === 'string');
  }
  const subjects = metadata?.subjects;
  if (Array.isArray(subjects)) {
    return subjects.map((s) => s?.subject).filter((s) => typeof s === 'string');
  }
  return [];
}

/**
 * @param {{ dois: string[], fetchImpl?: typeof fetch }} options
 * @returns {Promise<ZenodoResult>}
 */
export async function fetchZenodo({ dois, fetchImpl = fetch }) {
  const out = {};
  for (const doi of dois) {
    const url = `${API}?q=${encodeURIComponent(`doi:"${doi}"`)}&size=1`;
    const response = await fetchImpl(url, { headers: { 'User-Agent': 'cv-site-build' } });
    if (!response.ok) throw new Error(`Zenodo returned ${response.status} for ${doi}`);
    const body = await response.json();
    for (const record of body.hits?.hits ?? []) {
      out[bare(record.doi ?? doi)] = {
        views: record.stats?.unique_views ?? 0,
        downloads: record.stats?.unique_downloads ?? 0,
        resource_type: resourceTitle(record.metadata),
        keywords: resourceKeywords(record.metadata),
      };
    }
  }
  return out;
}

function doiList() {
  const entries = yaml.load(readFileSync('data/publications.yml', 'utf8'), {
    schema: yaml.CORE_SCHEMA,
  });
  return (entries ?? [])
    .map((entry) => entry.zenodo_doi)
    .filter(Boolean)
    .map(bare);
}

export async function run() {
  const cached = readCache('zenodo');
  const { value, stale } = await withFallback(
    'Zenodo',
    () => fetchZenodo({ dois: doiList() }),
    Object.keys(cached).length ? cached : undefined,
  );
  if (!stale) writeCache('zenodo', value);
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
