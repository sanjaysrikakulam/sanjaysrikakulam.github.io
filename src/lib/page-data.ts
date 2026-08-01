import { getCollection } from 'astro:content';
import { loadSite } from './site';
import { mergePublications } from './merge-publications';
import { timelineBars } from './timeline';
import { visibleItems, sortByOrder } from './visibility';
import { readCacheFile, type GithubCache } from './section-config';

export { sectionConfig } from './section-config';

const dataOf = <T>(entries: Array<{ data: T }>): T[] => entries.map((entry) => entry.data);

export async function loadPageData() {
  const site = loadSite();

  const github = readCacheFile<GithubCache>('github', {
    repos: {},
    contributions: { total: 0, byOrg: {} },
  });
  const openalex = readCacheFile<Record<string, { citations: number }>>('openalex', {});
  const zenodo = readCacheFile<Record<string, { views: number; downloads: number }>>('zenodo', {});

  const experience = visibleItems(dataOf(await getCollection('experience')));

  return {
    site,
    github,
    education: sortByOrder(
      visibleItems(dataOf(await getCollection('education'))),
      (a, b) => b.year - a.year,
    ),
    experience: [...experience].sort((a, b) => b.start.localeCompare(a.start)),
    projects: sortByOrder(visibleItems(dataOf(await getCollection('projects'))), (a, b) => {
      const stars = (name: string | null) => (name ? (github.repos[name]?.stars ?? 0) : 0);
      return stars(b.repo) - stars(a.repo);
    }),
    publications: mergePublications(dataOf(await getCollection('publications')), {
      openalex,
      zenodo,
    }),
    conferences: visibleItems(dataOf(await getCollection('conferences'))).sort(
      (a, b) => b.year - a.year || a.name.localeCompare(b.name),
    ),
    hackathons: visibleItems(dataOf(await getCollection('hackathons'))).sort(
      (a, b) => b.year - a.year,
    ),
    skills: sortByOrder(visibleItems(dataOf(await getCollection('skills')))),
    timeline: timelineBars(experience),
  };
}

export type PageData = Awaited<ReturnType<typeof loadPageData>>;
