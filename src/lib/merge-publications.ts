import type { Publication } from '../schemas/publications';

export type Metrics = { citations?: number; downloads?: number; views?: number };

export type MergedPublication = Publication & {
  metrics: Metrics;
  links: { doi?: string; zenodo?: string; slides?: string; poster?: string };
  hasBoth: boolean;
};

type Caches = {
  openalex: Record<string, { citations: number }>;
  zenodo: Record<string, { views: number; downloads: number }>;
};

const key = (doi: string) => doi.toLowerCase();
const resolve = (doi: string) => `https://doi.org/${doi}`;

const normaliseTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function findDuplicateTitles(entries: Publication[]) {
  const groups = new Map<string, string[]>();
  for (const entry of entries) {
    const normalised = normaliseTitle(entry.title);
    groups.set(normalised, [...(groups.get(normalised) ?? []), entry.title]);
  }
  return [...groups.entries()]
    .filter(([, titles]) => titles.length > 1)
    .map(([normalised, titles]) => ({ normalised, titles }));
}

export function mergePublications(entries: Publication[], caches: Caches): MergedPublication[] {
  for (const duplicate of findDuplicateTitles(entries)) {
    console.warn(
      `Possible duplicate publication "${duplicate.normalised}" appears ${duplicate.titles.length} times. ` +
        'If these are the same work, combine them into one entry with doi and zenodo_doi.',
    );
  }

  return entries
    .filter((entry) => entry.visible)
    .map((entry) => {
      const metrics: Metrics = {};
      const links: MergedPublication['links'] = {};

      if (entry.doi) {
        links.doi = resolve(entry.doi);
        const found = caches.openalex[key(entry.doi)];
        if (found) metrics.citations = found.citations;
      }
      if (entry.zenodo_doi) {
        links.zenodo = resolve(entry.zenodo_doi);
        const found = caches.zenodo[key(entry.zenodo_doi)];
        if (found) {
          metrics.downloads = found.downloads;
          metrics.views = found.views;
        }
      }
      if (entry.slides) links.slides = entry.slides;
      if (entry.poster) links.poster = entry.poster;

      return {
        ...entry,
        metrics,
        links,
        hasBoth: Boolean(entry.doi && entry.zenodo_doi),
      };
    })
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}
