import { describe, expect, it } from 'vitest';
import { experienceSchema } from '../../src/schemas/experience';
import { publicationSchema } from '../../src/schemas/publications';
import { projectSchema } from '../../src/schemas/projects';
import { conferenceSchema } from '../../src/schemas/conferences';
import { siteSchema } from '../../src/schemas/site';

describe('experienceSchema', () => {
  const valid = {
    title: 'Postdoctoral Researcher',
    org: 'Forschungszentrum Jülich GmbH',
    start: '2025-09',
    end: null,
    summary: 'Data science and bioinformatics for mass spectrometry.',
    highlights: ['One highlight.'],
  };

  it('accepts a minimal valid role and applies flag defaults', () => {
    const parsed = experienceSchema.parse(valid);
    expect(parsed.visible).toBe(true);
    expect(parsed.featured).toBe(false);
    expect(parsed.details).toEqual([]);
    expect(parsed.end).toBeNull();
  });

  it('rejects a start date that is not YYYY-MM', () => {
    expect(() => experienceSchema.parse({ ...valid, start: '2025' })).toThrow();
  });

  it('rejects a role with no highlights', () => {
    expect(() => experienceSchema.parse({ ...valid, highlights: [] })).toThrow();
  });

  it('rejects an unknown field so typos surface at build time', () => {
    expect(() => experienceSchema.parse({ ...valid, hilights: ['typo'] })).toThrow();
  });
});

describe('publicationSchema', () => {
  const valid = { title: 'A paper', type: 'journal', year: 2023, author_role: 'first' };

  it('accepts an entry with a DOI only', () => {
    expect(publicationSchema.parse({ ...valid, doi: '10.1093/x' }).doi).toBe('10.1093/x');
  });

  it('accepts an entry with a Zenodo DOI only', () => {
    const parsed = publicationSchema.parse({ ...valid, zenodo_doi: '10.5281/zenodo.1' });
    expect(parsed.zenodo_doi).toBe('10.5281/zenodo.1');
  });

  it('rejects an entry carrying neither identifier', () => {
    expect(() => publicationSchema.parse(valid)).toThrow(/doi/i);
  });

  it('rejects an unknown publication type', () => {
    expect(() => publicationSchema.parse({ ...valid, type: 'blogpost', doi: '10.1/x' })).toThrow();
  });

  it('rejects an unknown author role', () => {
    expect(() =>
      publicationSchema.parse({ ...valid, author_role: 'lead', doi: '10.1/x' }),
    ).toThrow();
  });

  it('rejects a bare DOI URL so the raw identifier is stored', () => {
    expect(() => publicationSchema.parse({ ...valid, doi: 'https://doi.org/10.1093/x' })).toThrow(
      /without/i,
    );
  });
});

describe('projectSchema', () => {
  it('accepts a null repo for work that is not public', () => {
    const parsed = projectSchema.parse({
      name: 'SeqSidecar',
      repo: null,
      summary: 'A columnar query engine.',
    });
    expect(parsed.repo).toBeNull();
  });

  it('rejects a repo that is not in owner/name form', () => {
    expect(() =>
      projectSchema.parse({ name: 'X', repo: 'https://github.com/a/b', summary: 's' }),
    ).toThrow(/owner\/name/i);
  });
});

describe('conferenceSchema', () => {
  it('accepts each presentation role', () => {
    for (const role of ['talk', 'poster', 'workshop', 'attended', 'panel']) {
      expect(conferenceSchema.parse({ name: 'C', year: 2025, role }).role).toBe(role);
    }
  });

  it('rejects an unknown role', () => {
    expect(() => conferenceSchema.parse({ name: 'C', year: 2025, role: 'keynote' })).toThrow();
  });
});

describe('siteSchema', () => {
  const valid = {
    profile: {
      name: 'Sanjay Kumar Srikakulam',
      headline: 'Computational methods for biology, and the infrastructure that runs them.',
      headline_accent: 'infrastructure',
      location: 'Germany',
      email: 'a@b.co',
    },
    links: { github: 'https://github.com/sanjaysrikakulam' },
    sections: [{ id: 'work' }],
  };

  it('applies display defaults', () => {
    const parsed = siteSchema.parse(valid);
    expect(parsed.display.photo).toBe(true);
    expect(parsed.display.open_source.per_view).toBe(3);
    expect(parsed.display.open_source.autoplay).toBe(true);
    expect(parsed.pdf.page_size).toBe('A4');
  });

  it('rejects a headline accent that does not appear in the headline', () => {
    expect(() =>
      siteSchema.parse({
        ...valid,
        profile: { ...valid.profile, headline_accent: 'nowhere' },
      }),
    ).toThrow(/accent/i);
  });

  it('rejects a malformed contact email', () => {
    expect(() =>
      siteSchema.parse({ ...valid, profile: { ...valid.profile, email: 'not-an-email' } }),
    ).toThrow();
  });

  it('accepts a proof entry carrying only a metric', () => {
    const parsed = siteSchema.parse({
      ...valid,
      proof: [{ metric: 'github.merged_prs', label: 'Merged pull requests' }],
    });
    expect(parsed.proof[0].value).toBeUndefined();
  });

  it('accepts a proof entry carrying only a literal value', () => {
    const parsed = siteSchema.parse({
      ...valid,
      proof: [{ value: '11 yrs', label: 'Research and infrastructure' }],
    });
    expect(parsed.proof[0].metric).toBeUndefined();
  });

  it('rejects a proof entry with neither a metric nor a value', () => {
    expect(() =>
      siteSchema.parse({ ...valid, proof: [{ label: 'Merged pull requests' }] }),
    ).toThrow(/metric/i);
  });
});
