import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import { readCache, writeCache, withFallback } from './lib/cache.mjs';
import { formatAuthors } from './lib/authors.mjs';
import { cleanText } from './lib/text.mjs';

/**
 * @typedef {object} ZenodoRecord
 * @property {number} views
 * @property {number} downloads
 * @property {string | null} resource_type
 * @property {string[]} keywords
 * @property {string | null} title
 * @property {string} authors_display
 * @property {Array<{ given?: string, family?: string, name?: string }>} authors
 * @property {number | null} year
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

// Zenodo returns authors as metadata.creators in two shapes. InvenioRDM nests
// them under person_or_org with given_name/family_name (or a name for an
// organisation); the legacy API gives a flat name written "Family, Given".
// Both are normalised to the { given, family } / { name } shape formatAuthors
// expects.
function normaliseCreator(creator) {
  const person = creator?.person_or_org;
  if (person) {
    if (person.family_name) {
      return person.given_name
        ? { given: cleanText(person.given_name), family: cleanText(person.family_name) }
        : { family: cleanText(person.family_name) };
    }
    return { name: cleanText(person.name) };
  }
  const name = creator?.name;
  if (typeof name !== 'string') return {};
  const comma = name.indexOf(',');
  if (comma === -1) return { name: cleanText(name) };
  const family = cleanText(name.slice(0, comma).trim());
  const given = cleanText(name.slice(comma + 1).trim());
  return given ? { given, family } : { family };
}

function creatorsOf(metadata) {
  const creators = metadata?.creators;
  if (!Array.isArray(creators)) return [];
  return creators.map(normaliseCreator).filter((author) => author.family || author.name);
}

function yearOf(metadata) {
  const date = metadata?.publication_date;
  if (typeof date !== 'string') return null;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
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
      const authors = creatorsOf(record.metadata);
      out[bare(record.doi ?? doi)] = {
        views: record.stats?.unique_views ?? 0,
        downloads: record.stats?.unique_downloads ?? 0,
        resource_type: resourceTitle(record.metadata),
        keywords: resourceKeywords(record.metadata),
        title: cleanText(record.metadata?.title) ?? null,
        authors_display: formatAuthors(authors),
        authors,
        year: yearOf(record.metadata),
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
