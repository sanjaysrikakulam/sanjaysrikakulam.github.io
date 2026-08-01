import { describe, expect, it } from 'vitest';
import { pdfSectionOrder, capItems } from '../../src/lib/pdf-sections';
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
  sections: [{ id: 'work' }],
  pdf: {
    page_size: 'A4',
    sections: ['profile', 'education', 'experience', 'publications', 'skills'],
    max_items: { publications: 3 },
  },
});

describe('pdfSectionOrder', () => {
  it('returns the configured order', () => {
    expect(pdfSectionOrder(site)).toEqual([
      'profile',
      'education',
      'experience',
      'publications',
      'skills',
    ]);
  });

  it('excludes sections the owner left out', () => {
    expect(pdfSectionOrder(site)).not.toContain('hackathons');
  });
});

describe('capItems', () => {
  const items = [1, 2, 3, 4, 5];

  it('caps a section that declares a maximum', () => {
    expect(capItems(items, site, 'publications')).toEqual([1, 2, 3]);
  });

  it('leaves a section without a maximum untouched', () => {
    expect(capItems(items, site, 'experience')).toEqual(items);
  });

  it('does not pad a list shorter than the maximum', () => {
    expect(capItems([1], site, 'publications')).toEqual([1]);
  });
});
