import { describe, expect, it } from 'vitest';
import { slugify, yamlArrayParser } from '../../src/lib/slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Galaxy Europe')).toBe('galaxy-europe');
  });

  it('strips diacritics so umlauts survive as plain letters', () => {
    expect(slugify('Forschungszentrum Jülich')).toBe('forschungszentrum-julich');
  });

  it('collapses punctuation and repeated separators', () => {
    expect(slugify('MetaProFi: an ultrafast  filter!')).toBe('metaprofi-an-ultrafast-filter');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --Hello--  ')).toBe('hello');
  });
});

describe('yamlArrayParser', () => {
  const parse = yamlArrayParser((entry) => String(entry.name));

  it('parses a YAML array and injects derived ids', () => {
    const result = parse('- name: Alpha\n- name: Beta\n');
    expect(result).toEqual([
      { id: 'alpha', name: 'Alpha' },
      { id: 'beta', name: 'Beta' },
    ]);
  });

  it('returns an empty array for an empty file', () => {
    expect(parse('')).toEqual([]);
    expect(parse('# only a comment\n')).toEqual([]);
  });

  it('throws when the file is not a YAML sequence', () => {
    expect(() => parse('name: Alpha\n')).toThrow(/expected a YAML list/i);
  });

  it('throws on a duplicate derived id so collisions cannot pass silently', () => {
    expect(() => parse('- name: Alpha\n- name: Alpha\n')).toThrow(/duplicate/i);
  });
});
