import { describe, expect, it } from 'vitest';
import { getAnalytics } from '../../src/lib/analytics';

const umami = {
  script_url: 'https://umami.example.com/script.js',
  website_id: '4f94f13d-eac8-4e45-9ec0-af31e280b0de',
};

describe('getAnalytics', () => {
  it('returns null when the analytics block is absent', () => {
    expect(getAnalytics({})).toBeNull();
  });

  it('returns null when no umami block is set', () => {
    expect(getAnalytics({ analytics: {} })).toBeNull();
  });

  it('returns null when the script URL is blank', () => {
    expect(getAnalytics({ analytics: { umami: { ...umami, script_url: '   ' } } })).toBeNull();
  });

  it('returns null when the website id is blank', () => {
    expect(getAnalytics({ analytics: { umami: { ...umami, website_id: '   ' } } })).toBeNull();
  });

  it('returns the tag attributes when umami is configured', () => {
    expect(getAnalytics({ analytics: { umami } })).toEqual({
      scriptUrl: 'https://umami.example.com/script.js',
      websiteId: '4f94f13d-eac8-4e45-9ec0-af31e280b0de',
      domains: undefined,
    });
  });

  it('trims surrounding whitespace from the script URL and website id', () => {
    const result = getAnalytics({
      analytics: {
        umami: { script_url: `  ${umami.script_url}  `, website_id: `  ${umami.website_id}  ` },
      },
    });
    expect(result?.scriptUrl).toBe(umami.script_url);
    expect(result?.websiteId).toBe(umami.website_id);
  });

  it('joins configured domains into a single data-domains value', () => {
    const result = getAnalytics({
      analytics: { umami: { ...umami, domains: ['example.com', ' example.org '] } },
    });
    expect(result?.domains).toBe('example.com,example.org');
  });

  it('leaves domains undefined when the list is empty or only blanks', () => {
    expect(
      getAnalytics({ analytics: { umami: { ...umami, domains: [] } } })?.domains,
    ).toBeUndefined();
    expect(
      getAnalytics({ analytics: { umami: { ...umami, domains: ['  '] } } })?.domains,
    ).toBeUndefined();
  });
});
