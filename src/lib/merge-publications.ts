import type { Publication } from '../schemas/publications';

export type Metrics = { citations?: number; downloads?: number; views?: number };

export type Author = { given?: string; family?: string; name?: string };

type Bibliographic = {
  title?: string | null;
  authors_display?: string;
  authors?: Author[];
  venue?: string | null;
  year?: number | null;
};

export type MergedPublication = Omit<Publication, 'title' | 'year'> & {
  title: string;
  year: number;
  metrics: Metrics;
  links: { doi?: string; zenodo?: string; slides?: string; poster?: string };
  hasBoth: boolean;
};

type Caches = {
  openalex?: Record<string, { citations: number }>;
  zenodo?: Record<string, { views: number; downloads: number } & Bibliographic>;
  crossref?: Record<string, Bibliographic>;
};

const key = (doi: string) => doi.toLowerCase();
const resolve = (doi: string) => `https://doi.org/${doi}`;

const normaliseTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function findDuplicateTitles<T extends { title?: string }>(entries: T[]) {
  const groups = new Map<string, string[]>();
  for (const entry of entries) {
    if (!entry.title) continue;
    const normalised = normaliseTitle(entry.title);
    groups.set(normalised, [...(groups.get(normalised) ?? []), entry.title]);
  }
  return [...groups.entries()]
    .filter(([, titles]) => titles.length > 1)
    .map(([normalised, titles]) => ({ normalised, titles }));
}

// A publication entry can carry its own title, venue, year, and authors, but the
// common case leaves them to the DOI. Bibliographic data resolves in order: the
// YAML value (an explicit override), then the fetched cache, then an error, so a
// missing record surfaces loudly rather than dropping the entry from the CV.
export function mergePublications(entries: Publication[], caches: Caches): MergedPublication[] {
  const openalex = caches.openalex ?? {};
  const zenodo = caches.zenodo ?? {};
  const crossref = caches.crossref ?? {};

  const hydrated = entries
    .filter((entry) => entry.visible)
    .map((entry): MergedPublication => {
      const metrics: Metrics = {};
      const links: MergedPublication['links'] = {};

      const source: Bibliographic =
        (entry.doi ? crossref[key(entry.doi)] : undefined) ??
        (entry.zenodo_doi ? zenodo[key(entry.zenodo_doi)] : undefined) ??
        {};

      const identifier = entry.doi ?? entry.zenodo_doi;
      const title = entry.title ?? source.title ?? undefined;
      if (!title) {
        throw new Error(
          `Publication "${identifier}" has no title. Add a title in data/publications.yml or check the DOI record.`,
        );
      }
      const year = entry.year ?? source.year ?? undefined;
      if (year === undefined) {
        throw new Error(
          `Publication "${title}" (${identifier}) has no year. Add a year in data/publications.yml or check the DOI record.`,
        );
      }
      const authors_display = entry.authors_display ?? source.authors_display ?? undefined;
      const venue = entry.venue ?? source.venue ?? undefined;

      if (entry.doi) {
        links.doi = resolve(entry.doi);
        const found = openalex[key(entry.doi)];
        if (found) metrics.citations = found.citations;
      }
      if (entry.zenodo_doi) {
        links.zenodo = resolve(entry.zenodo_doi);
        const found = zenodo[key(entry.zenodo_doi)];
        if (found) {
          metrics.downloads = found.downloads;
          metrics.views = found.views;
        }
      }
      if (entry.slides) links.slides = entry.slides;
      if (entry.poster) links.poster = entry.poster;

      return {
        ...entry,
        title,
        year,
        authors_display: authors_display || undefined,
        venue: venue || undefined,
        metrics,
        links,
        hasBoth: Boolean(entry.doi && entry.zenodo_doi),
      };
    });

  for (const duplicate of findDuplicateTitles(hydrated)) {
    console.warn(
      `Possible duplicate publication "${duplicate.normalised}" appears ${duplicate.titles.length} times. ` +
        'If these are the same work, combine them into one entry with doi and zenodo_doi.',
    );
  }

  return hydrated.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}
