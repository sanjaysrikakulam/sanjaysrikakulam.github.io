// Kept free of astro:content so these helpers stay unit testable without
// booting an Astro build. Do not merge this back into page-data.ts.
import { readFileSync, existsSync } from 'node:fs';
import type { Site } from '../schemas/site';

export type GithubCache = {
  repos: Record<
    string,
    { stars: number; forks: number; language: string | null; pushed_at: string; url: string }
  >;
  contributions: { total: number; byOrg: Record<string, number> };
};

export function readCacheFile<T>(name: string, fallback: T): T {
  const path = `data/.cache/${name}.json`;
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/**
 * A cache file can be valid JSON and still be structurally wrong, for example
 * a bare {} left behind by an interrupted fetch. Guaranteeing the shape once
 * here means every consumer can index into it safely, and a damaged cache
 * costs the page its figures instead of failing the build.
 */
export function normaliseGithubCache(raw: unknown): GithubCache {
  const source = (raw ?? {}) as Partial<GithubCache>;
  const contributions = source.contributions ?? { total: 0, byOrg: {} };
  return {
    repos: source.repos ?? {},
    contributions: {
      total: contributions.total ?? 0,
      byOrg: contributions.byOrg ?? {},
    },
  };
}

export function sectionConfig(site: Site, id: string) {
  const section = site.sections.find((entry) => entry.id === id);
  return {
    title: section?.title ?? '',
    description: section?.description ?? '',
    visible: section?.visible ?? false,
  };
}
