import { describe, expect, it, vi } from 'vitest';
import { mergePublications, findDuplicateTitles } from '../../src/lib/merge-publications';

const base = {
  type: 'journal' as const,
  year: 2023,
  author_role: 'first' as const,
  bibtex: true,
  visible: true,
  featured: false,
};

const caches = {
  openalex: { '10.1093/bioinformatics/btad101': { citations: 11 } },
  zenodo: {
    '10.5281/zenodo.14936846': {
      views: 736,
      downloads: 326,
      resource_type: 'Preprint',
      keywords: ['scheduling'],
    },
  },
};

describe('mergePublications', () => {
  it('attaches citations to an entry with a DOI only', () => {
    const [entry] = mergePublications(
      [{ ...base, title: 'MetaProFi', doi: '10.1093/bioinformatics/btad101' }],
      caches,
    );
    expect(entry.metrics).toEqual({ citations: 11 });
    expect(entry.hasBoth).toBe(false);
    expect(entry.links.doi).toBe('https://doi.org/10.1093/bioinformatics/btad101');
    expect(entry.links.zenodo).toBeUndefined();
  });

  it('attaches downloads and views to an entry with a Zenodo DOI only', () => {
    const [entry] = mergePublications(
      [{ ...base, title: 'TPV preprint', zenodo_doi: '10.5281/zenodo.14936846' }],
      caches,
    );
    expect(entry.metrics).toEqual({ downloads: 326, views: 736 });
    expect(entry.links.zenodo).toBe('https://doi.org/10.5281/zenodo.14936846');
  });

  it('merges an entry carrying both identifiers into one record with both figures', () => {
    const [entry] = mergePublications(
      [
        {
          ...base,
          title: 'TPV Broker',
          doi: '10.1093/bioinformatics/btad101',
          zenodo_doi: '10.5281/zenodo.14936846',
        },
      ],
      caches,
    );
    expect(entry.hasBoth).toBe(true);
    expect(entry.metrics).toEqual({ citations: 11, downloads: 326, views: 736 });
    expect(entry.links.doi).toBeDefined();
    expect(entry.links.zenodo).toBeDefined();
  });

  it('matches DOIs case-insensitively', () => {
    const [entry] = mergePublications(
      [{ ...base, title: 'Upper', doi: '10.1093/BIOINFORMATICS/btad101' }],
      caches,
    );
    expect(entry.metrics.citations).toBe(11);
  });

  it('leaves metrics empty when the cache has no entry, never defaulting to zero', () => {
    const [entry] = mergePublications([{ ...base, title: 'Unknown', doi: '10.1/absent' }], caches);
    expect(entry.metrics).toEqual({});
  });

  it('excludes hidden entries', () => {
    const merged = mergePublications(
      [
        { ...base, title: 'Shown', doi: '10.1/a' },
        { ...base, title: 'Hidden', doi: '10.1/b', visible: false },
      ],
      caches,
    );
    expect(merged.map((e) => e.title)).toEqual(['Shown']);
  });

  it('sorts newest first and breaks ties by title', () => {
    const merged = mergePublications(
      [
        { ...base, title: 'B', year: 2020, doi: '10.1/b' },
        { ...base, title: 'A', year: 2024, doi: '10.1/a' },
        { ...base, title: 'A2', year: 2024, doi: '10.1/a2' },
      ],
      caches,
    );
    expect(merged.map((e) => e.title)).toEqual(['A', 'A2', 'B']);
  });

  it('promotes slides and poster URLs into links when present', () => {
    const [entry] = mergePublications(
      [
        {
          ...base,
          title: 'Talk',
          zenodo_doi: '10.5281/zenodo.14936846',
          slides: 'https://example.org/s',
          poster: 'https://example.org/p',
        },
      ],
      caches,
    );
    expect(entry.links.slides).toBe('https://example.org/s');
    expect(entry.links.poster).toBe('https://example.org/p');
  });
});

describe('findDuplicateTitles', () => {
  it('reports two entries whose titles normalise identically', () => {
    const duplicates = findDuplicateTitles([
      { ...base, title: 'Optimized Meta-Scheduling in Galaxy', doi: '10.1/a' },
      { ...base, title: 'optimized  meta scheduling in galaxy!', zenodo_doi: '10.5281/zenodo.1' },
    ]);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].titles).toHaveLength(2);
  });

  it('reports nothing when all titles are distinct', () => {
    expect(
      findDuplicateTitles([
        { ...base, title: 'One', doi: '10.1/a' },
        { ...base, title: 'Two', doi: '10.1/b' },
      ]),
    ).toEqual([]);
  });

  it('warns instead of throwing, because similar titles can be separate outputs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mergePublications(
      [
        { ...base, title: 'Same Thing', doi: '10.1/a' },
        { ...base, title: 'same thing', doi: '10.1/b' },
      ],
      caches,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('same thing'));
    warn.mockRestore();
  });
});
