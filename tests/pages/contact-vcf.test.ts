import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/contact.vcf';

// Exercises the endpoint end to end: it reads the real data/site.yml through
// loadSite(), so this also guards the card's contact facts against a schema or
// data regression. The context is trimmed to the one field the route reads.
type Context = Parameters<typeof GET>[0];
const context = {
  site: new URL('https://sanjay.srikakulam.de/'),
} as unknown as Context;

describe('GET /contact.vcf', () => {
  it('serves a downloadable vCard with the right headers', async () => {
    const response = await GET(context);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/vcard');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
  });

  it('builds the card from the site profile', async () => {
    const body = await (await GET(context)).text();
    expect(body).toContain('BEGIN:VCARD');
    expect(body).toContain('FN:Dr. Sanjay Kumar Srikakulam');
    expect(body).toContain('TITLE:Postdoctoral Researcher');
    expect(body).toContain('ORG:Forschungszentrum Jülich');
    expect(body).toContain('EMAIL;TYPE=INTERNET,WORK:s.srikakulam@fz-juelich.de');
    expect(body).toContain('URL:https://orcid.org/0000-0002-1752-5060');
    expect(body.endsWith('END:VCARD\r\n')).toBe(true);
  });
});
