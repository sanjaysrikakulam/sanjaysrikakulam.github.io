import { describe, expect, it } from 'vitest';
import { sectionConfig } from '../../src/lib/page-data';
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
