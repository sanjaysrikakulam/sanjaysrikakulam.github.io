import { describe, expect, it } from 'vitest';
import {
  visibleItems,
  featuredItems,
  pdfItems,
  sortByOrder,
  type Flagged,
} from '../../src/lib/visibility';

const item = (name: string, over: Partial<Flagged> = {}) => ({
  name,
  visible: true,
  featured: false,
  ...over,
});

describe('visibleItems', () => {
  it('keeps items whose visible flag is true', () => {
    const result = visibleItems([item('a'), item('b', { visible: false }), item('c')]);
    expect(result.map((i) => i.name)).toEqual(['a', 'c']);
  });

  it('returns an empty array when everything is hidden', () => {
    expect(visibleItems([item('a', { visible: false })])).toEqual([]);
  });
});

describe('featuredItems', () => {
  it('keeps only visible items that are also featured', () => {
    const result = featuredItems([
      item('a', { featured: true }),
      item('b'),
      item('c', { featured: true, visible: false }),
    ]);
    expect(result.map((i) => i.name)).toEqual(['a']);
  });
});

describe('pdfItems', () => {
  it('includes visible items when the section default is true', () => {
    expect(pdfItems([item('a'), item('b')], true).map((i) => i.name)).toEqual(['a', 'b']);
  });

  it('lets an item opt out with in_pdf false', () => {
    const result = pdfItems([item('a'), item('b', { in_pdf: false })], true);
    expect(result.map((i) => i.name)).toEqual(['a']);
  });

  it('lets an item opt in when the section default is false', () => {
    const result = pdfItems([item('a'), item('b', { in_pdf: true })], false);
    expect(result.map((i) => i.name)).toEqual(['b']);
  });

  it('never includes a hidden item even when in_pdf is true', () => {
    expect(pdfItems([item('a', { visible: false, in_pdf: true })], true)).toEqual([]);
  });
});

describe('sortByOrder', () => {
  it('places explicitly ordered items ahead of unordered ones', () => {
    const result = sortByOrder([item('a'), item('b', { order: 1 }), item('c', { order: 0 })]);
    expect(result.map((i) => i.name)).toEqual(['c', 'b', 'a']);
  });

  it('applies the fallback comparator to items with no order', () => {
    const result = sortByOrder([item('b'), item('a')], (x, y) => x.name.localeCompare(y.name));
    expect(result.map((i) => i.name)).toEqual(['a', 'b']);
  });

  it('does not mutate the input array', () => {
    const input = [item('b', { order: 2 }), item('a', { order: 1 })];
    sortByOrder(input);
    expect(input.map((i) => i.name)).toEqual(['b', 'a']);
  });
});
