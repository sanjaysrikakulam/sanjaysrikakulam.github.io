import { describe, expect, it } from 'vitest';
import { normaliseGithubCache, sectionConfig } from '../../src/lib/section-config';
import { siteSchema } from '../../src/schemas/site';

const site = siteSchema.parse({
  profile: {
    name: 'N',
    headline: 'Methods and infrastructure',
    headline_accent: 'infrastructure',
    location: 'Germany',
    email: 'a@b.co',
  },
  links: { github: 'https://github.com/x' },
  sections: [
    { id: 'work', title: 'Selected projects', description: 'Projects with users.' },
    { id: 'hidden', visible: false },
  ],
});

describe('sectionConfig', () => {
  it('returns the configured title and description', () => {
    expect(sectionConfig(site, 'work')).toEqual({
      title: 'Selected projects',
      description: 'Projects with users.',
      visible: true,
    });
  });

  it('reports a section switched off in site.yml as not visible', () => {
    expect(sectionConfig(site, 'hidden').visible).toBe(false);
  });

  it('reports an unknown section as not visible so nothing renders by accident', () => {
    expect(sectionConfig(site, 'nope').visible).toBe(false);
  });

  it('falls back to empty strings when title and description are omitted', () => {
    const config = sectionConfig(site, 'hidden');
    expect(config.title).toBe('');
    expect(config.description).toBe('');
  });
});

describe('normaliseGithubCache', () => {
  it('fills the whole shape from an empty object, so consumers can index safely', () => {
    expect(normaliseGithubCache({})).toEqual({ repos: {}, contributions: { total: 0, byOrg: {} } });
  });

  it('fills the shape from null and from undefined', () => {
    for (const input of [null, undefined]) {
      expect(normaliseGithubCache(input)).toEqual({
        repos: {},
        contributions: { total: 0, byOrg: {} },
      });
    }
  });

  it('supplies byOrg when contributions exists but is partial', () => {
    const result = normaliseGithubCache({ contributions: { total: 7 } });
    expect(result.contributions.total).toBe(7);
    expect(result.contributions.byOrg).toEqual({});
  });

  it('preserves a complete cache unchanged', () => {
    const full = {
      repos: { 'a/b': { stars: 1, forks: 2, language: 'Go', pushed_at: 'x', url: 'y' } },
      contributions: { total: 9, byOrg: { org: 4 } },
    };
    expect(normaliseGithubCache(full)).toEqual(full);
  });
});
