import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';
import { educationSchema } from '../../src/schemas/education';
import { experienceSchema } from '../../src/schemas/experience';
import { projectSchema } from '../../src/schemas/projects';
import { publicationSchema } from '../../src/schemas/publications';
import { conferenceSchema } from '../../src/schemas/conferences';
import { hackathonSchema } from '../../src/schemas/hackathons';
import { skillGroupSchema } from '../../src/schemas/skills';
import { siteSchema } from '../../src/schemas/site';

const load = (name: string) =>
  (yaml.load(readFileSync(`data/${name}.yml`, 'utf8'), { schema: yaml.CORE_SCHEMA }) ??
    []) as unknown[];

describe('data files parse against their schemas', () => {
  it.each([
    ['education', educationSchema],
    ['experience', experienceSchema],
    ['projects', projectSchema],
    ['publications', publicationSchema],
    ['conferences', conferenceSchema],
    ['hackathons', hackathonSchema],
    ['skills', skillGroupSchema],
  ])('%s', (name, schema) => {
    for (const entry of load(name)) expect(() => schema.parse(entry)).not.toThrow();
  });

  it('site', () => {
    const raw = yaml.load(readFileSync('data/site.yml', 'utf8'), { schema: yaml.CORE_SCHEMA });
    expect(() => siteSchema.parse(raw)).not.toThrow();
  });
});

describe('data completeness against the source CV', () => {
  it('has all six roles', () => {
    expect(load('experience')).toHaveLength(6);
  });

  it('has all three degrees', () => {
    expect(load('education')).toHaveLength(3);
  });

  it('has at least the sixteen publications listed in the CV', () => {
    expect(load('publications').length).toBeGreaterThanOrEqual(16);
  });

  it('has all fifteen skill groups', () => {
    expect(load('skills')).toHaveLength(15);
  });

  it('records exactly two first-author publications', () => {
    const first = (load('publications') as Array<{ author_role: string }>).filter(
      (p) => p.author_role === 'first',
    );
    expect(first).toHaveLength(2);
  });

  it('starts conferences and hackathons empty for the owner to fill', () => {
    expect(load('conferences')).toEqual([]);
    expect(load('hackathons')).toEqual([]);
  });
});

describe('data hygiene', () => {
  it('keeps the home address and phone number out of the repository', () => {
    for (const name of ['site', 'experience', 'education', 'projects']) {
      const text = readFileSync(`data/${name}.yml`, 'utf8');
      expect(text).not.toMatch(/\+49[-\s]?176/);
      expect(text).not.toMatch(/\b32139\b/);
      expect(text).not.toMatch(/Spenge/i);
    }
  });

  it('does not ship the source CV inside the repository tree', () => {
    expect(existsSync('public/Sanjay_Srikakulam_CV_source.pdf')).toBe(false);
  });

  it('stores bare DOIs so link building stays consistent', () => {
    const text = readFileSync('data/publications.yml', 'utf8');
    expect(text).not.toContain('https://doi.org/');
  });
});
