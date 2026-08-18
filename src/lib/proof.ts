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
//   openalex.citations          -> sum of citations across every openalex cache entry
//   openalex.h_index            -> h-index computed from the openalex citation counts
//   publications.count          -> number of publication entries passed in
//   experience.years            -> full years from the earliest experience start to now
//
// An entry may also carry a literal `value`, used when `metric` is absent or
// cannot be resolved (missing cache, unknown key). Never throws; a metric and
// cache combination that yields nothing falls through to `value`, and an
// entry with neither yields the placeholder "n/a".
//
// A `suffix` is appended to a resolved numeric figure (e.g. " yrs") so a live
// count can keep its unit without hardcoding the number into `value`; it is not
// applied to the `value` fallback, which carries its own unit.
//
// A `source` sub-line may embed `{metric.key}` placeholders; each is replaced
// with the resolved figure (or the "n/a" placeholder), so a caption like
// "h-index {openalex.h_index}" stays live the same way the main figure does.
import type { GithubCache } from './section-config';

type ZenodoCache = Record<string, { views: number; downloads: number }>;
type OpenalexCache = Record<string, { citations: number }>;

export type ProofEntry = {
  value?: string;
  metric?: string;
  label: string;
  source?: string;
  suffix?: string;
};

export type ProofCaches = {
  github?: GithubCache;
  zenodo?: ZenodoCache;
  openalex?: OpenalexCache;
  publications?: unknown[];
  experience?: Array<{ start: string }>;
};

export type ResolvedProof = { display: string; label: string; source?: string };

const formatter = new Intl.NumberFormat('en-GB');
const PLACEHOLDER = 'n/a';
const GITHUB_ORG_PREFIX = 'github.merged_prs.';

function fullYearsSince(start: string, now: Date): number | undefined {
  // start is "YYYY-MM" (month optional); count only whole years elapsed, so the
  // figure ticks over on the anniversary month rather than at New Year.
  const [year, month] = start.split('-').map(Number);
  if (!Number.isFinite(year)) return undefined;
  let years = now.getFullYear() - year;
  if (Number.isFinite(month) && now.getMonth() + 1 < month) years -= 1;
  return years >= 0 ? years : undefined;
}

function resolveMetric(metric: string, caches: ProofCaches, now: Date): number | undefined {
  // Every step below is optional-chained because a cache file only has to
  // parse as JSON to bypass the fallback in readCacheFile; a truncated or
  // hand-edited file can be `{}` or missing a nested key while still being
  // valid JSON, and that must degrade to the literal value rather than throw.
  if (metric === 'github.merged_prs') return caches.github?.contributions?.total;
  if (metric.startsWith(GITHUB_ORG_PREFIX)) {
    const org = metric.slice(GITHUB_ORG_PREFIX.length);
    return caches.github?.contributions?.byOrg?.[org];
  }
  if (metric === 'zenodo.downloads' || metric === 'zenodo.views') {
    if (!caches.zenodo) return undefined;
    const field = metric === 'zenodo.downloads' ? 'downloads' : 'views';
    return Object.values(caches.zenodo).reduce((sum, entry) => sum + (entry?.[field] ?? 0), 0);
  }
  if (metric === 'openalex.citations') {
    if (!caches.openalex) return undefined;
    return Object.values(caches.openalex).reduce((sum, entry) => sum + (entry?.citations ?? 0), 0);
  }
  if (metric === 'openalex.h_index') {
    if (!caches.openalex) return undefined;
    // h papers each cited at least h times: walk the counts high-to-low and
    // keep the largest rank whose citation count still clears its own rank.
    const counts = Object.values(caches.openalex)
      .map((entry) => entry?.citations ?? 0)
      .sort((a, b) => b - a);
    let h = 0;
    for (let i = 0; i < counts.length && counts[i] >= i + 1; i++) h = i + 1;
    return h;
  }
  if (metric === 'publications.count') return caches.publications?.length;
  if (metric === 'experience.years') {
    const starts = (caches.experience ?? []).map((entry) => entry?.start).filter(Boolean);
    if (starts.length === 0) return undefined;
    // "YYYY-MM" strings order lexicographically, so the min string is earliest.
    const earliest = starts.reduce((min, start) => (start < min ? start : min));
    return fullYearsSince(earliest, now);
  }
  return undefined;
}

const SOURCE_METRIC = /\{([^}]+)\}/g;

function resolveSource(
  source: string | undefined,
  caches: ProofCaches,
  now: Date,
): string | undefined {
  if (source === undefined) return undefined;
  return source.replace(SOURCE_METRIC, (_match, key: string) => {
    const value = resolveMetric(key.trim(), caches, now);
    return Number.isFinite(value) ? formatter.format(value as number) : PLACEHOLDER;
  });
}

export function resolveProof(
  entries: ProofEntry[],
  caches: ProofCaches,
  now: Date = new Date(),
): ResolvedProof[] {
  return entries.map((entry) => {
    const resolved = entry.metric ? resolveMetric(entry.metric, caches, now) : undefined;
    const display = Number.isFinite(resolved)
      ? formatter.format(resolved as number) + (entry.suffix ?? '')
      : (entry.value ?? PLACEHOLDER);
    return { display, label: entry.label, source: resolveSource(entry.source, caches, now) };
  });
}
