import { describe, expect, it } from 'vitest';
import { yamlArrayParser } from '../../src/lib/slug';
import { conferenceId, experienceId, publicationId } from '../../src/lib/entry-ids';

describe('conferenceId', () => {
  it('gives two posters at the same conference and year different ids when titles differ', () => {
    const a = conferenceId({
      name: 'Galaxy Europe',
      year: 2024,
      role: 'poster',
      title: 'MetaProFi',
    });
    const b = conferenceId({
      name: 'Galaxy Europe',
      year: 2024,
      role: 'poster',
      title: 'SeqSidecar',
    });
    expect(a).not.toBe(b);
  });

  it('produces a clean id with no trailing separator when title is absent', () => {
    const id = conferenceId({ name: 'Galaxy Europe', year: 2024, role: 'attended' });
    expect(id).toBe('Galaxy Europe-2024-attended');
    expect(id.endsWith('-')).toBe(false);
  });

  it('collides for two genuinely identical entries', () => {
    const a = conferenceId({
      name: 'Galaxy Europe',
      year: 2024,
      role: 'poster',
      title: 'MetaProFi',
    });
    const b = conferenceId({
      name: 'Galaxy Europe',
      year: 2024,
      role: 'poster',
      title: 'MetaProFi',
    });
    expect(a).toBe(b);
  });
});

describe('experienceId', () => {
  it('gives two concurrent roles at the same org and start month different ids when job titles differ', () => {
    const a = experienceId({
      org: 'Forschungszentrum Julich',
      start: '2025-09',
      title: 'Postdoctoral Researcher',
    });
    const b = experienceId({
      org: 'Forschungszentrum Julich',
      start: '2025-09',
      title: 'Guest Scientist',
    });
    expect(a).not.toBe(b);
  });

  it('collides for two genuinely identical entries', () => {
    const a = experienceId({ org: 'Acme', start: '2025-09', title: 'Engineer' });
    const b = experienceId({ org: 'Acme', start: '2025-09', title: 'Engineer' });
    expect(a).toBe(b);
  });
});

describe('publicationId', () => {
  it('uses the DOI as the identity so a fetched title is not needed', () => {
    expect(publicationId({ doi: '10.1093/x', zenodo_doi: '10.5281/zenodo.1' })).toBe('10.1093/x');
  });

  it('falls back to the Zenodo DOI when there is no CrossRef DOI', () => {
    expect(publicationId({ zenodo_doi: '10.5281/zenodo.1' })).toBe('10.5281/zenodo.1');
  });
});

describe('yamlArrayParser wired with publicationId', () => {
  const parse = yamlArrayParser((entry) => publicationId(entry));

  it('derives slugged ids from the identifier, not the title', () => {
    const result = parse(
      [
        '- doi: 10.1093/bioinformatics/btad101',
        '  type: journal',
        '  author_role: first',
        '- zenodo_doi: 10.5281/zenodo.500',
        '  type: presentation',
        '  author_role: contributing',
        '',
      ].join('\n'),
    );
    expect(result.map((entry) => entry.id)).toEqual([
      '10-1093-bioinformatics-btad101',
      '10-5281-zenodo-500',
    ]);
  });
});

describe('yamlArrayParser wired with conferenceId', () => {
  const parse = yamlArrayParser((entry) => conferenceId(entry));

  it('does not collide two posters at the same conference and year with different titles', () => {
    const result = parse(
      [
        '- name: Galaxy Europe',
        '  year: 2024',
        '  role: poster',
        '  title: MetaProFi',
        '- name: Galaxy Europe',
        '  year: 2024',
        '  role: poster',
        '  title: SeqSidecar',
        '',
      ].join('\n'),
    );
    expect(result.map((entry) => entry.id)).toEqual([
      'galaxy-europe-2024-poster-metaprofi',
      'galaxy-europe-2024-poster-seqsidecar',
    ]);
  });

  it('still throws when two entries are genuinely identical', () => {
    const yaml = [
      '- name: Galaxy Europe',
      '  year: 2024',
      '  role: poster',
      '  title: MetaProFi',
      '- name: Galaxy Europe',
      '  year: 2024',
      '  role: poster',
      '  title: MetaProFi',
      '',
    ].join('\n');
    expect(() => parse(yaml)).toThrow(/duplicate/i);
  });
});

describe('yamlArrayParser wired with experienceId', () => {
  const parse = yamlArrayParser((entry) => experienceId(entry));

  it('does not collide two concurrent roles at the same org and start month', () => {
    const result = parse(
      [
        '- org: Forschungszentrum Julich',
        '  start: 2025-09',
        '  title: Postdoctoral Researcher',
        '- org: Forschungszentrum Julich',
        '  start: 2025-09',
        '  title: Guest Scientist',
        '',
      ].join('\n'),
    );
    expect(result.map((entry) => entry.id)).toEqual([
      'forschungszentrum-julich-2025-09-postdoctoral-researcher',
      'forschungszentrum-julich-2025-09-guest-scientist',
    ]);
  });

  it('still throws when two entries are genuinely identical', () => {
    const yaml = [
      '- org: Acme',
      '  start: 2025-09',
      '  title: Engineer',
      '- org: Acme',
      '  start: 2025-09',
      '  title: Engineer',
      '',
    ].join('\n');
    expect(() => parse(yaml)).toThrow(/duplicate/i);
  });
});
