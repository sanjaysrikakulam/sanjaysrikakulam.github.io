import { describe, expect, it } from 'vitest';
import { buildVCard, splitName } from '../../src/lib/vcard';
import { siteSchema } from '../../src/schemas/site';

const site = siteSchema.parse({
  profile: {
    name: 'Sanjay Kumar Srikakulam',
    headline: 'Methods and infrastructure',
    headline_accent: 'infrastructure',
    location: 'Germany',
    email: 's.srikakulam@fz-juelich.de',
    prefix: 'Dr.',
    title: 'Postdoctoral Researcher',
    org: 'Forschungszentrum Jülich',
  },
  links: {
    github: 'https://github.com/sanjaysrikakulam',
    orcid: 'https://orcid.org/0000-0002-1752-5060',
  },
  sections: [{ id: 'work' }],
});

describe('splitName', () => {
  it('takes the last token as family and the rest as given', () => {
    expect(splitName('Sanjay Kumar Srikakulam')).toEqual({
      given: 'Sanjay Kumar',
      family: 'Srikakulam',
    });
  });

  it('leaves family empty for a single-token name', () => {
    expect(splitName('Prince')).toEqual({ given: 'Prince', family: '' });
  });
});

describe('buildVCard', () => {
  const vcard = buildVCard(site, { url: 'https://sanjay.srikakulam.de/' });
  const lines = vcard.split('\r\n');

  it('opens and closes a version 3.0 card', () => {
    expect(lines[0]).toBe('BEGIN:VCARD');
    expect(lines[1]).toBe('VERSION:3.0');
    expect(lines).toContain('END:VCARD');
  });

  it('uses CRLF line endings with a trailing break', () => {
    expect(vcard.endsWith('END:VCARD\r\n')).toBe(true);
    expect(vcard).not.toMatch(/[^\r]\n/);
  });

  it('renders the structured and formatted name with the prefix', () => {
    expect(lines).toContain('N:Srikakulam;Sanjay Kumar;;Dr.;');
    expect(lines).toContain('FN:Dr. Sanjay Kumar Srikakulam');
  });

  it('carries the title, org, work email, site and ORCID', () => {
    expect(lines).toContain('TITLE:Postdoctoral Researcher');
    expect(lines).toContain('ORG:Forschungszentrum Jülich');
    expect(lines).toContain('EMAIL;TYPE=INTERNET,WORK:s.srikakulam@fz-juelich.de');
    expect(lines).toContain('URL:https://sanjay.srikakulam.de/');
    expect(lines).toContain('URL:https://orcid.org/0000-0002-1752-5060');
  });

  it('omits optional lines that are not set', () => {
    const minimal = buildVCard(
      siteSchema.parse({
        profile: {
          name: 'Ada Lovelace',
          headline: 'Methods and infrastructure',
          headline_accent: 'infrastructure',
          location: 'UK',
        },
        links: { github: 'https://github.com/x' },
        sections: [{ id: 'work' }],
      }),
    );
    expect(minimal).not.toMatch(/TITLE:|ORG:|EMAIL:|URL:/);
    expect(minimal).toContain('N:Lovelace;Ada;;;');
  });
});
