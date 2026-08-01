import { describe, expect, it, vi } from 'vitest';
import { fetchOpenAlex } from '../../scripts/fetch-openalex.mjs';
import { fetchZenodo } from '../../scripts/fetch-zenodo.mjs';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe('fetchOpenAlex', () => {
  it('normalises DOI URLs down to bare lowercase keys', async () => {
    const fetchImpl = vi.fn(async () =>
      ok({
        results: [{ doi: 'https://doi.org/10.1093/BIOINFORMATICS/btad101', cited_by_count: 11 }],
      }),
    );
    const result = await fetchOpenAlex({
      dois: ['10.1093/bioinformatics/btad101'],
      mailto: 'x@example.org',
      fetchImpl,
    });
    expect(result['10.1093/bioinformatics/btad101']).toEqual({ citations: 11 });
  });

  it('batches requests so a long list does not exceed the filter length', async () => {
    const dois = Array.from({ length: 55 }, (_, i) => `10.1000/x${i}`);
    const fetchImpl = vi.fn(async () => ok({ results: [] }));
    await fetchOpenAlex({ dois, mailto: 'x@example.org', fetchImpl });
    expect(fetchImpl.mock.calls.length).toBeGreaterThan(1);
  });

  it('includes the mailto parameter so requests use the polite pool', async () => {
    const fetchImpl = vi.fn(async () => ok({ results: [] }));
    await fetchOpenAlex({ dois: ['10.1/a'], mailto: 'x@example.org', fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toContain('mailto=x%40example.org');
  });

  it('omits a DOI that OpenAlex does not know instead of recording zero', async () => {
    const fetchImpl = vi.fn(async () => ok({ results: [] }));
    const result = await fetchOpenAlex({ dois: ['10.1/missing'], mailto: 'x@e.org', fetchImpl });
    expect(result['10.1/missing']).toBeUndefined();
  });

  it('throws on a non-ok response so the caller can fall back to cache', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchOpenAlex({ dois: ['10.1/a'], mailto: 'x@e.org', fetchImpl })).rejects.toThrow(
      /503/,
    );
  });
});

describe('fetchZenodo', () => {
  it('extracts view and download counts and carries metadata forward', async () => {
    const fetchImpl = vi.fn(async () =>
      ok({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.19882942',
              stats: { unique_views: 508, unique_downloads: 464 },
              metadata: {
                resource_type: { title: { en: 'Publication' } },
                subjects: [{ subject: 'federated infrastructure' }],
              },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.19882942'], fetchImpl });
    expect(result['10.5281/zenodo.19882942']).toEqual({
      views: 508,
      downloads: 464,
      resource_type: 'Publication',
      keywords: ['federated infrastructure'],
    });
  });

  it('defaults missing statistics to zero instead of undefined', async () => {
    const fetchImpl = vi.fn(async () =>
      ok({ hits: { hits: [{ doi: '10.5281/zenodo.1', stats: {}, metadata: {} }] } }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.1'], fetchImpl });
    expect(result['10.5281/zenodo.1']).toEqual({
      views: 0,
      downloads: 0,
      resource_type: null,
      keywords: [],
    });
  });

  it('handles a plain string resource type as well as a localised object', async () => {
    const fetchImpl = vi.fn(async () =>
      ok({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.2',
              stats: {},
              metadata: { resource_type: { title: 'Poster' } },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.2'], fetchImpl });
    expect(result['10.5281/zenodo.2'].resource_type).toBe('Poster');
  });
});
