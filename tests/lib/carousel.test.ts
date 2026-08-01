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

  it('maps a scroll position to the nearest evenly spaced page', () => {
    // Four pages sit at 0, MAX/3, 2*MAX/3, and MAX.
    expect(pageAt(MAX / 3, WIDE, VIEW)).toBe(1);
    expect(pageAt((2 * MAX) / 3, WIDE, VIEW)).toBe(2);
    expect(pageAt(MAX * 0.15, WIDE, VIEW)).toBe(0);
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
  it('spreads interior pages evenly across the scrollable distance', () => {
    expect(scrollTargetFor(1, WIDE, VIEW)).toBeCloseTo(MAX / 3);
    expect(scrollTargetFor(2, WIDE, VIEW)).toBeCloseTo((2 * MAX) / 3);
  });

  it('lands the final page on maximum scroll so it is reachable', () => {
    expect(scrollTargetFor(3, WIDE, VIEW)).toBeCloseTo(MAX);
  });

  it('clamps a negative page to the start', () => {
    expect(scrollTargetFor(-1, WIDE, VIEW)).toBe(0);
  });

  it('clamps an out-of-range page to the end', () => {
    expect(scrollTargetFor(99, WIDE, VIEW)).toBeCloseTo(MAX);
  });
});

describe('page navigation round-trip', () => {
  // The regression at the heart of the dead-dot bug: clicking a dot scrolls to
  // its target, and the settled position must report that same dot as active.
  // The old page*clientWidth targeting broke this for the last dot.
  it('reports every page target as its own page', () => {
    for (const [wide, view] of [
      [WIDE, VIEW],
      [3000, 1000],
      [5000, 900],
      [2200, 1056],
    ] as const) {
      const total = pageCount(wide, view);
      for (let page = 0; page < total; page += 1) {
        expect(pageAt(scrollTargetFor(page, wide, view), wide, view)).toBe(page);
      }
    }
  });
});
