import { describe, expect, it } from 'vitest';
import { resolveProof, type ProofCaches, type ProofEntry } from '../../src/lib/proof';
import type { GithubCache } from '../../src/lib/section-config';

describe('resolveProof', () => {
  it('resolves a github metric from the cache', () => {
    const entries: ProofEntry[] = [{ metric: 'github.merged_prs', label: 'Merged pull requests' }];
    const caches: ProofCaches = { github: { repos: {}, contributions: { total: 434, byOrg: {} } } };
    expect(resolveProof(entries, caches)[0].display).toBe('434');
  });

  it('falls back to the literal value when the metric cannot be resolved', () => {
    const entries: ProofEntry[] = [
      { metric: 'not.a.real.metric', value: '99', label: 'Placeholder figure' },
    ];
    expect(resolveProof(entries, {})[0].display).toBe('99');
  });

  it('uses the literal value when no metric is given', () => {
    const entries: ProofEntry[] = [{ value: '11 yrs', label: 'Research and infrastructure' }];
    expect(resolveProof(entries, {})[0].display).toBe('11 yrs');
  });

  it('falls back to the literal value when the relevant cache is entirely absent', () => {
    const entries: ProofEntry[] = [
      { metric: 'github.merged_prs', value: '999', label: 'Merged pull requests' },
    ];
    expect(resolveProof(entries, {})[0].display).toBe('999');
  });

  it('formats a resolved number with thousands separators', () => {
    const entries: ProofEntry[] = [{ metric: 'zenodo.downloads', label: 'Zenodo downloads' }];
    const caches: ProofCaches = {
      zenodo: {
        a: { views: 0, downloads: 1000 },
        b: { views: 0, downloads: 648 },
      },
    };
    expect(resolveProof(entries, caches)[0].display).toBe('1,648');
  });

  it('resolves an org-scoped github metric', () => {
    const entries: ProofEntry[] = [
      { metric: 'github.merged_prs.usegalaxy-eu', label: 'Merged pull requests, usegalaxy-eu' },
    ];
    const caches: ProofCaches = {
      github: { repos: {}, contributions: { total: 434, byOrg: { 'usegalaxy-eu': 358 } } },
    };
    expect(resolveProof(entries, caches)[0].display).toBe('358');
  });

  it('sums zenodo views across every cache entry', () => {
    const entries: ProofEntry[] = [{ metric: 'zenodo.views', label: 'Zenodo views' }];
    const caches: ProofCaches = {
      zenodo: { a: { views: 100, downloads: 0 }, b: { views: 200, downloads: 0 } },
    };
    expect(resolveProof(entries, caches)[0].display).toBe('300');
  });

  it('resolves a publication count from the entries passed in', () => {
    const entries: ProofEntry[] = [{ metric: 'publications.count', label: 'Publications' }];
    expect(resolveProof(entries, { publications: [{}, {}, {}] })[0].display).toBe('3');
  });

  it('falls back to a placeholder when neither a metric nor a value resolves', () => {
    const entries: ProofEntry[] = [{ label: 'Nothing to show' }];
    expect(resolveProof(entries, {})[0].display).toBe('n/a');
  });

  it('carries the label and source through unchanged', () => {
    const entries: ProofEntry[] = [{ value: '16', label: 'Publications', source: 'OpenAlex' }];
    const [resolved] = resolveProof(entries, {});
    expect(resolved.label).toBe('Publications');
    expect(resolved.source).toBe('OpenAlex');
  });

  // A corrupt or partially-written cache file parses as valid but incomplete
  // JSON (readCacheFile casts whatever it parses to the expected type without
  // validating its shape), so these malformed fixtures are cast past the
  // compiler to reproduce what resolveMetric actually receives at runtime.
  it('falls back to the literal value when the github cache is missing contributions entirely', () => {
    const entries: ProofEntry[] = [
      { metric: 'github.merged_prs', value: '999', label: 'Merged pull requests' },
    ];
    const caches: ProofCaches = { github: { repos: {} } as unknown as GithubCache };
    expect(() => resolveProof(entries, caches)).not.toThrow();
    expect(resolveProof(entries, caches)[0].display).toBe('999');
  });

  it('falls back to the literal value when the github cache has contributions but no byOrg', () => {
    const entries: ProofEntry[] = [
      {
        metric: 'github.merged_prs.usegalaxy-eu',
        value: '999',
        label: 'Merged pull requests, usegalaxy-eu',
      },
    ];
    const caches: ProofCaches = {
      github: { repos: {}, contributions: { total: 434 } } as unknown as GithubCache,
    };
    expect(() => resolveProof(entries, caches)).not.toThrow();
    expect(resolveProof(entries, caches)[0].display).toBe('999');
  });

  it('treats a zenodo entry missing the summed field as zero instead of throwing', () => {
    const entries: ProofEntry[] = [{ metric: 'zenodo.downloads', label: 'Zenodo downloads' }];
    const caches: ProofCaches = {
      zenodo: {
        a: { views: 5 } as unknown as { views: number; downloads: number },
        b: { views: 2, downloads: 648 },
      },
    };
    expect(() => resolveProof(entries, caches)).not.toThrow();
    expect(resolveProof(entries, caches)[0].display).toBe('648');
  });
});
