import { describe, expect, it } from 'vitest';
import { getAnalytics } from '../../src/lib/analytics';

describe('getAnalytics', () => {
  it('returns null when the analytics block is absent', () => {
    expect(getAnalytics({})).toBeNull();
  });

  it('returns null when no goatcounter endpoint is set', () => {
    expect(getAnalytics({ analytics: {} })).toBeNull();
  });

  it('returns null when the goatcounter endpoint is blank', () => {
    expect(getAnalytics({ analytics: { goatcounter: '   ' } })).toBeNull();
  });

  it('returns the endpoint when a goatcounter URL is configured', () => {
    const result = getAnalytics({
      analytics: { goatcounter: 'https://code.goatcounter.com/count' },
    });
    expect(result).toEqual({ endpoint: 'https://code.goatcounter.com/count' });
  });

  it('trims surrounding whitespace from the endpoint', () => {
    const result = getAnalytics({
      analytics: { goatcounter: '  https://code.goatcounter.com/count  ' },
    });
    expect(result?.endpoint).toBe('https://code.goatcounter.com/count');
  });
});
