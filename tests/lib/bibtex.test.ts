import { describe, expect, it } from 'vitest';
import { citationKey, toBibtex } from '../../src/lib/bibtex';

const entry = {
  title: 'MetaProFi: an ultrafast chunked Bloom filter',
  type: 'journal' as const,
  venue: 'Bioinformatics',
  year: 2023,
  authors_display: 'Srikakulam SK, Keller S, Kalinina OV',
  author_role: 'first' as const,
  doi: '10.1093/bioinformatics/btad101',
  bibtex: true,
  visible: true,
  featured: false,
};

describe('citationKey', () => {
  it('combines first author surname, year, and first meaningful title word', () => {
    expect(citationKey(entry)).toBe('srikakulam2023metaprofi');
  });

  it('skips leading articles when choosing the title word', () => {
    expect(citationKey({ ...entry, title: 'The Galaxy platform' })).toBe('srikakulam2023galaxy');
  });

  it('falls back to the venue when no authors are listed', () => {
    const key = citationKey({ ...entry, authors_display: undefined, venue: 'Zenodo' });
    expect(key).toBe('zenodo2023metaprofi');
  });
});

describe('toBibtex', () => {
  it('emits an article entry for a journal publication', () => {
    const output = toBibtex(entry);
    expect(output).toMatch(/^@article\{srikakulam2023metaprofi,/);
    expect(output).toContain('journal = {Bioinformatics}');
    expect(output).toContain('year    = {2023}');
    expect(output).toContain('doi     = {10.1093/bioinformatics/btad101}');
    expect(output.trim().endsWith('}')).toBe(true);
  });

  it('emits inproceedings for a conference entry', () => {
    expect(toBibtex({ ...entry, type: 'conference' })).toMatch(/^@inproceedings\{/);
  });

  it('emits misc for a deliverable and records the Zenodo DOI', () => {
    const output = toBibtex({
      ...entry,
      type: 'deliverable',
      doi: undefined,
      zenodo_doi: '10.5281/zenodo.1',
    });
    expect(output).toMatch(/^@misc\{/);
    expect(output).toContain('doi     = {10.5281/zenodo.1}');
  });

  it('escapes braces and backslashes so the entry stays valid', () => {
    expect(toBibtex({ ...entry, title: 'A {braced} title' })).toContain('A \\{braced\\} title');
  });

  it('omits fields that have no value instead of emitting empty braces', () => {
    expect(toBibtex({ ...entry, venue: undefined })).not.toContain('journal = {}');
  });
});
