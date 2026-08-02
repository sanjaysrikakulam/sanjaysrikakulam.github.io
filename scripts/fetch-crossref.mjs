import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import { readCache, writeCache, withFallback } from './lib/cache.mjs';
import { formatAuthors } from './lib/authors.mjs';
import { cleanText } from './lib/text.mjs';

/**
 * @typedef {object} CrossrefRecord
 * @property {string} title
 * @property {string} authors_display
 * @property {Array<{ given?: string, family?: string, name?: string }>} authors
 * @property {string | null} venue
 * @property {number | null} year
 */

/**
 * @typedef {Record<string, CrossrefRecord>} CrossrefResult
 */

const API = 'https://api.crossref.org/works';

const bare = (doi) =>
  String(doi)
    .replace(/^https?:\/\/doi\.org\//i, '')
    .toLowerCase();

function authorsOf(message) {
  return (message.author ?? []).map((author) => {
    const record = {};
    if (author.given) record.given = cleanText(author.given);
    if (author.family) record.family = cleanText(author.family);
    if (!author.family && author.name) record.name = cleanText(author.name);
    return record;
  });
}

/**
 * @param {{ dois: string[], mailto: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<CrossrefResult>}
 */
export async function fetchCrossref({ dois, mailto, fetchImpl = fetch }) {
  const out = {};
  for (const doi of dois) {
    const url = `${API}/${bare(doi)}?mailto=${encodeURIComponent(mailto)}`;
    const response = await fetchImpl(url, { headers: { 'User-Agent': 'cv-site-build' } });
    if (!response.ok) throw new Error(`CrossRef returned ${response.status} for ${doi}`);
    const { message } = await response.json();
    const authors = authorsOf(message);
    out[bare(message.DOI ?? doi)] = {
      title: cleanText(message.title?.[0]) ?? null,
      authors_display: formatAuthors(authors),
      authors,
      venue: cleanText(message['container-title']?.[0]) ?? null,
      year: message.issued?.['date-parts']?.[0]?.[0] ?? null,
    };
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
  const cached = readCache('crossref');
  const { value, stale } = await withFallback(
    'CrossRef',
    () => fetchCrossref({ dois: doiList(), mailto: 'sanjaysrikakulam@gmail.com' }),
    Object.keys(cached).length ? cached : undefined,
  );
  if (!stale) writeCache('crossref', value);
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
