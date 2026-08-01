import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { readCache, writeCache, withFallback } from './lib/cache.mjs';

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
        keywords: (record.metadata?.subjects ?? []).map((s) => s.subject).filter(Boolean),
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
