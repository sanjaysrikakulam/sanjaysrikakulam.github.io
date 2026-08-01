// Resolves each site.yml proof-strip entry to a display string, pulling live
// figures from the fetched caches so the strip cannot silently drift from
// reality the way a hand-typed value can (see data/site.yml history: the
// Zenodo download count was hardcoded and had already gone stale).
//
// Supported metric keys:
//   github.merged_prs           -> github cache contributions.total
//   github.merged_prs.<org>     -> github cache contributions.byOrg[<org>]
//   zenodo.downloads            -> sum of downloads across every zenodo cache entry
//   zenodo.views                -> sum of views across every zenodo cache entry
//   publications.count          -> number of publication entries passed in
//
// An entry may also carry a literal `value`, used when `metric` is absent or
// cannot be resolved (missing cache, unknown key). Never throws; a metric and
// cache combination that yields nothing falls through to `value`, and an
// entry with neither yields the placeholder "n/a".
import type { GithubCache } from './section-config';

type ZenodoCache = Record<string, { views: number; downloads: number }>;

export type ProofEntry = { value?: string; metric?: string; label: string; source?: string };

export type ProofCaches = {
  github?: GithubCache;
  zenodo?: ZenodoCache;
  publications?: unknown[];
};

export type ResolvedProof = { display: string; label: string; source?: string };

const formatter = new Intl.NumberFormat('en-GB');
const PLACEHOLDER = 'n/a';
const GITHUB_ORG_PREFIX = 'github.merged_prs.';

function resolveMetric(metric: string, caches: ProofCaches): number | undefined {
  if (metric === 'github.merged_prs') return caches.github?.contributions.total;
  if (metric.startsWith(GITHUB_ORG_PREFIX)) {
    const org = metric.slice(GITHUB_ORG_PREFIX.length);
    return caches.github?.contributions.byOrg[org];
  }
  if (metric === 'zenodo.downloads' || metric === 'zenodo.views') {
    if (!caches.zenodo) return undefined;
    const field = metric === 'zenodo.downloads' ? 'downloads' : 'views';
    return Object.values(caches.zenodo).reduce((sum, entry) => sum + entry[field], 0);
  }
  if (metric === 'publications.count') return caches.publications?.length;
  return undefined;
}

export function resolveProof(entries: ProofEntry[], caches: ProofCaches): ResolvedProof[] {
  return entries.map((entry) => {
    const resolved = entry.metric ? resolveMetric(entry.metric, caches) : undefined;
    const display = Number.isFinite(resolved)
      ? formatter.format(resolved as number)
      : (entry.value ?? PLACEHOLDER);
    return { display, label: entry.label, source: entry.source };
  });
}
