import { describe, expect, it } from 'vitest';
import { fetchCrossref } from '../../scripts/fetch-crossref.mjs';
import { createFetchMock, failedResponse, jsonResponse } from '../helpers/fetch-mock';

const work = (overrides = {}) =>
  jsonResponse({
    message: {
      DOI: '10.1093/bioinformatics/btad101',
      title: ['MetaProFi: an ultrafast chunked Bloom filter'],
      'container-title': ['Bioinformatics'],
      issued: { 'date-parts': [[2023, 3, 1]] },
      author: [
        { given: 'Sanjay Kumar', family: 'Srikakulam', sequence: 'first' },
        { given: 'Sebastian', family: 'Keller', sequence: 'additional' },
      ],
      ...overrides,
    },
  });

describe('fetchCrossref', () => {
  it('extracts title, venue, year, and a formatted author string', async () => {
    const fetchImpl = createFetchMock(async () => work());
    const result = await fetchCrossref({
      dois: ['10.1093/bioinformatics/btad101'],
      mailto: 'x@example.org',
      fetchImpl,
    });
    expect(result['10.1093/bioinformatics/btad101']).toEqual({
      title: 'MetaProFi: an ultrafast chunked Bloom filter',
      authors_display: 'Srikakulam SK, Keller S',
      authors: [
        { given: 'Sanjay Kumar', family: 'Srikakulam' },
        { given: 'Sebastian', family: 'Keller' },
      ],
      venue: 'Bioinformatics',
      year: 2023,
    });
  });

  it('normalises DOI URLs down to bare lowercase keys', async () => {
    const fetchImpl = createFetchMock(async () => work());
    const result = await fetchCrossref({
      dois: ['https://doi.org/10.1093/BIOINFORMATICS/btad101'],
      mailto: 'x@example.org',
      fetchImpl,
    });
    expect(result['10.1093/bioinformatics/btad101']).toBeDefined();
  });

  it('includes the mailto parameter so requests use the polite pool', async () => {
    const fetchImpl = createFetchMock(async () => work());
    await fetchCrossref({
      dois: ['10.1093/bioinformatics/btad101'],
      mailto: 'x@example.org',
      fetchImpl,
    });
    expect(String(fetchImpl.mock.calls[0][0])).toContain('mailto=x%40example.org');
  });

  it('keeps a group author name verbatim', async () => {
    const fetchImpl = createFetchMock(async () =>
      work({ author: [{ name: 'The Galaxy Community' }] }),
    );
    const result = await fetchCrossref({
      dois: ['10.1093/bioinformatics/btad101'],
      mailto: 'x@e.org',
      fetchImpl,
    });
    expect(result['10.1093/bioinformatics/btad101'].authors_display).toBe('The Galaxy Community');
  });

  it('strips publisher markup and normalises whitespace in the title', async () => {
    const fetchImpl = createFetchMock(async () =>
      work({ title: ['<tt>PanPA</tt>\n                    : generation of graphs'] }),
    );
    const result = await fetchCrossref({
      dois: ['10.1093/bioinformatics/btad101'],
      mailto: 'x@e.org',
      fetchImpl,
    });
    expect(result['10.1093/bioinformatics/btad101'].title).toBe('PanPA: generation of graphs');
  });

  it('records a null venue when container-title is absent', async () => {
    const fetchImpl = createFetchMock(async () => work({ 'container-title': [] }));
    const result = await fetchCrossref({
      dois: ['10.1093/bioinformatics/btad101'],
      mailto: 'x@e.org',
      fetchImpl,
    });
    expect(result['10.1093/bioinformatics/btad101'].venue).toBeNull();
  });

  it('throws on a non-ok response so the caller can fall back to cache', async () => {
    const fetchImpl = createFetchMock(async () => failedResponse(503));
    await expect(fetchCrossref({ dois: ['10.1/a'], mailto: 'x@e.org', fetchImpl })).rejects.toThrow(
      /503/,
    );
  });
});
