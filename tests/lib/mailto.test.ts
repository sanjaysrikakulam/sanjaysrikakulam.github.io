import { describe, expect, it } from 'vitest';
import { buildMailto } from '../../src/lib/mailto';

describe('buildMailto', () => {
  it('returns a bare mailto when no fields are set', () => {
    expect(buildMailto('a@b.co')).toBe('mailto:a@b.co');
  });

  it('encodes spaces as %20 and commas as %2C, never `+`', () => {
    const href = buildMailto('a@b.co', { subject: 'Hello, Sanjay' });
    expect(href).toBe('mailto:a@b.co?subject=Hello%2C%20Sanjay');
    expect(href).not.toContain('+');
  });

  it('encodes newlines in the body as %0A', () => {
    expect(buildMailto('a@b.co', { body: 'Hi Sanjay,\n' })).toBe(
      'mailto:a@b.co?body=Hi%20Sanjay%2C%0A',
    );
  });

  it('joins subject and body with a single &', () => {
    expect(buildMailto('a@b.co', { subject: 'Hi', body: 'Text' })).toBe(
      'mailto:a@b.co?subject=Hi&body=Text',
    );
  });

  it('omits fields that are empty strings', () => {
    expect(buildMailto('a@b.co', { subject: '', body: '' })).toBe('mailto:a@b.co');
  });
});
