import { describe, expect, it } from 'vitest';
import { fetchOpenAlex } from '../../scripts/fetch-openalex.mjs';
import { fetchZenodo } from '../../scripts/fetch-zenodo.mjs';
import { createFetchMock, failedResponse, jsonResponse } from '../helpers/fetch-mock';

describe('fetchOpenAlex', () => {
  it('normalises DOI URLs down to bare lowercase keys', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
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
    const fetchImpl = createFetchMock(async () => jsonResponse({ results: [] }));
    await fetchOpenAlex({ dois, mailto: 'x@example.org', fetchImpl });
    expect(fetchImpl.mock.calls.length).toBeGreaterThan(1);
  });

  it('includes the mailto parameter so requests use the polite pool', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse({ results: [] }));
    await fetchOpenAlex({ dois: ['10.1/a'], mailto: 'x@example.org', fetchImpl });
    expect(String(fetchImpl.mock.calls[0][0])).toContain('mailto=x%40example.org');
  });

  it('omits a DOI that OpenAlex does not know instead of recording zero', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse({ results: [] }));
    const result = await fetchOpenAlex({ dois: ['10.1/missing'], mailto: 'x@e.org', fetchImpl });
    expect(result['10.1/missing']).toBeUndefined();
  });

  it('throws on a non-ok response so the caller can fall back to cache', async () => {
    const fetchImpl = createFetchMock(async () => failedResponse(503));
    await expect(fetchOpenAlex({ dois: ['10.1/a'], mailto: 'x@e.org', fetchImpl })).rejects.toThrow(
      /503/,
    );
  });
});

describe('fetchZenodo', () => {
  it('extracts view and download counts and carries bibliographic metadata forward', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.19882942',
              stats: { unique_views: 508, unique_downloads: 464 },
              metadata: {
                title: 'Towards Federated, Certified Infrastructures',
                publication_date: '2026-01-15',
                creators: [
                  {
                    person_or_org: {
                      type: 'personal',
                      family_name: 'Twardziok',
                      given_name: 'Sven',
                    },
                  },
                  {
                    person_or_org: {
                      type: 'personal',
                      family_name: 'Srikakulam',
                      given_name: 'Sanjay Kumar',
                    },
                  },
                ],
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
      title: 'Towards Federated, Certified Infrastructures',
      authors_display: 'Twardziok S, Srikakulam SK',
      authors: [
        { given: 'Sven', family: 'Twardziok' },
        { given: 'Sanjay Kumar', family: 'Srikakulam' },
      ],
      year: 2026,
    });
  });

  it('defaults missing statistics to zero and bibliographic fields to empty', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({ hits: { hits: [{ doi: '10.5281/zenodo.1', stats: {}, metadata: {} }] } }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.1'], fetchImpl });
    expect(result['10.5281/zenodo.1']).toEqual({
      views: 0,
      downloads: 0,
      resource_type: null,
      keywords: [],
      title: null,
      authors_display: '',
      authors: [],
      year: null,
    });
  });

  it('parses legacy "Family, Given" creator names', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.10',
              stats: {},
              metadata: {
                publication_date: '2023-09-01',
                creators: [{ name: 'Srikakulam, Sanjay Kumar' }, { name: 'Keller, Sebastian' }],
              },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.10'], fetchImpl });
    expect(result['10.5281/zenodo.10'].authors_display).toBe('Srikakulam SK, Keller S');
    expect(result['10.5281/zenodo.10'].year).toBe(2023);
  });

  it('keeps an organizational creator name verbatim', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.11',
              stats: {},
              metadata: {
                creators: [
                  { person_or_org: { type: 'organizational', name: 'The Galaxy Community' } },
                ],
              },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.11'], fetchImpl });
    expect(result['10.5281/zenodo.11'].authors_display).toBe('The Galaxy Community');
  });

  it('handles a plain string resource type as well as a localised object', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
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

  it('reads keywords from metadata.keywords, the shape Zenodo actually returns', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.3',
              stats: {},
              metadata: { keywords: ['NFDI', 'de.NBI', 'EOSC'] },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.3'], fetchImpl });
    expect(result['10.5281/zenodo.3'].keywords).toEqual(['NFDI', 'de.NBI', 'EOSC']);
  });

  it('falls back to metadata.subjects when keywords is absent (InvenioRDM shape)', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.4',
              stats: {},
              metadata: {
                subjects: [{ subject: 'federated infrastructure' }, { subject: 'cloud' }],
              },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.4'], fetchImpl });
    expect(result['10.5281/zenodo.4'].keywords).toEqual(['federated infrastructure', 'cloud']);
  });

  it('returns an empty array when both keywords and subjects are absent', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({ hits: { hits: [{ doi: '10.5281/zenodo.5', stats: {}, metadata: {} }] } }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.5'], fetchImpl });
    expect(result['10.5281/zenodo.5'].keywords).toEqual([]);
  });

  it('returns an empty array when keywords is present but empty', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: { hits: [{ doi: '10.5281/zenodo.6', stats: {}, metadata: { keywords: [] } }] },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.6'], fetchImpl });
    expect(result['10.5281/zenodo.6'].keywords).toEqual([]);
  });

  it('returns an empty array when subjects is present but empty', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: { hits: [{ doi: '10.5281/zenodo.7', stats: {}, metadata: { subjects: [] } }] },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.7'], fetchImpl });
    expect(result['10.5281/zenodo.7'].keywords).toEqual([]);
  });

  it('filters out null, undefined, and non-string entries from keywords', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.8',
              stats: {},
              metadata: { keywords: ['GHGA', null, undefined, 42, 'GA4GH'] },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.8'], fetchImpl });
    expect(result['10.5281/zenodo.8'].keywords).toEqual(['GHGA', 'GA4GH']);
  });

  it('filters out entries with a missing or non-string subject from subjects', async () => {
    const fetchImpl = createFetchMock(async () =>
      jsonResponse({
        hits: {
          hits: [
            {
              doi: '10.5281/zenodo.9',
              stats: {},
              metadata: {
                subjects: [{ subject: 'cloud' }, { subject: null }, {}, { subject: 7 }],
              },
            },
          ],
        },
      }),
    );
    const result = await fetchZenodo({ dois: ['10.5281/zenodo.9'], fetchImpl });
    expect(result['10.5281/zenodo.9'].keywords).toEqual(['cloud']);
  });
});
