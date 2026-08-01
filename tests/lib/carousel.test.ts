import { describe, expect, it } from 'vitest';
import { pageCount, pageAt, scrollTargetFor } from '../../src/lib/carousel';

// Ten cards at three per view: content 3557px wide inside a 1056px rail.
const WIDE = 3557;
const VIEW = 1056;
const MAX = WIDE - VIEW; // 2501

describe('pageCount', () => {
  it('counts pages a reader can actually reach', () => {
    expect(pageCount(WIDE, VIEW)).toBe(4);
  });

  it('returns one when the content fits without scrolling', () => {
    expect(pageCount(800, 1056)).toBe(1);
  });

  it('returns an exact count when content divides evenly', () => {
    expect(pageCount(3000, 1000)).toBe(3);
  });

  it('never returns zero for a zero-width rail', () => {
    expect(pageCount(0, 0)).toBe(1);
  });
});

describe('pageAt', () => {
  it('reports the first page at rest', () => {
    expect(pageAt(0, WIDE, VIEW)).toBe(0);
  });

  it('reports the last page once maximum scroll is reached', () => {
    expect(pageAt(MAX, WIDE, VIEW)).toBe(3);
  });

  it('reports the last page when scrolled within rounding distance of the end', () => {
    expect(pageAt(MAX - 1, WIDE, VIEW)).toBe(3);
  });

  it('rounds to the nearest page mid-scroll', () => {
    expect(pageAt(VIEW * 1.4, WIDE, VIEW)).toBe(1);
  });

  it('never reports a page beyond the last', () => {
    expect(pageAt(99999, WIDE, VIEW)).toBe(3);
  });

  it('returns the first page for a rail that has not been laid out yet', () => {
    expect(pageAt(0, 0, 0)).toBe(0);
    expect(pageAt(0, WIDE, 0)).toBe(0);
  });

  it('never returns NaN for any zero-width input', () => {
    for (const scrollLeft of [0, 500, 99999]) {
      expect(Number.isNaN(pageAt(scrollLeft, 0, 0))).toBe(false);
      expect(Number.isNaN(pageAt(scrollLeft, WIDE, 0))).toBe(false);
    }
  });
});

describe('scrollTargetFor', () => {
  it('targets the exact offset for an interior page', () => {
    expect(scrollTargetFor(1, WIDE, VIEW)).toBe(VIEW);
  });

  it('clamps the final page to maximum scroll so it is reachable', () => {
    expect(scrollTargetFor(3, WIDE, VIEW)).toBe(MAX);
  });

  it('clamps a negative page to the start', () => {
    expect(scrollTargetFor(-1, WIDE, VIEW)).toBe(0);
  });

  it('clamps an out-of-range page to the end', () => {
    expect(scrollTargetFor(99, WIDE, VIEW)).toBe(MAX);
  });
});
