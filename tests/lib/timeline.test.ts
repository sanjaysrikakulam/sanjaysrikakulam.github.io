import { describe, expect, it } from 'vitest';
import { timelineBars } from '../../src/lib/timeline';

const role = (over: Record<string, unknown>) => ({
  title: 'Role',
  org: 'Org',
  start: '2020-01',
  end: '2021-01',
  summary: 's',
  highlights: ['h'],
  details: [],
  affiliations: [],
  tags: [],
  visible: true,
  featured: false,
  ...over,
});

const now = new Date('2026-01-01T00:00:00Z');

describe('timelineBars', () => {
  it('spans the first bar from zero and the last to one hundred percent', () => {
    const { bars } = timelineBars(
      [role({ start: '2016-01', end: '2018-01' }), role({ start: '2024-01', end: '2026-01' })],
      { now },
    );
    expect(bars[0].left).toBeCloseTo(0, 5);
    expect(bars[1].left + bars[1].width).toBeCloseTo(100, 5);
  });

  it('treats a null end as the current month', () => {
    const { bars } = timelineBars(
      [role({ start: '2020-01', end: '2022-01' }), role({ start: '2025-01', end: null })],
      { now },
    );
    expect(bars[1].to).toBe('Present');
    expect(bars[1].left + bars[1].width).toBeCloseTo(100, 5);
  });

  it('orders bars oldest first so the chart reads left to right', () => {
    const { bars } = timelineBars(
      [role({ org: 'Later', start: '2024-01' }), role({ org: 'Earlier', start: '2015-01' })],
      { now },
    );
    expect(bars.map((bar) => bar.label)).toEqual(['Earlier', 'Later']);
  });

  it('gives a very short role a minimum clickable width', () => {
    const { bars } = timelineBars(
      [role({ start: '2013-01', end: '2013-02' }), role({ start: '2026-01', end: '2026-01' })],
      { now },
    );
    expect(bars[0].width).toBeGreaterThanOrEqual(2);
  });

  it('derives an anchor id from the organisation, start date, and job title', () => {
    const { bars } = timelineBars([role({ org: 'Forschungszentrum Jülich', start: '2025-09' })], {
      now,
    });
    expect(bars[0].id).toBe('role-forschungszentrum-julich-2025-09-role');
  });

  it('gives two concurrent roles at the same org and start month different anchors when job titles differ', () => {
    const { bars } = timelineBars(
      [
        role({ org: 'Acme', start: '2025-09', title: 'Postdoctoral Researcher' }),
        role({ org: 'Acme', start: '2025-09', title: 'Guest Scientist' }),
      ],
      { now },
    );
    expect(bars[0].id).not.toBe(bars[1].id);
  });

  it('uses the declared track colour and falls back when absent', () => {
    const { bars } = timelineBars([role({ track_colour: '#7C3AED' }), role({ start: '2022-01' })], {
      now,
    });
    expect(bars[0].colour).toBe('#7C3AED');
    expect(bars[1].colour).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('excludes hidden roles', () => {
    const { bars } = timelineBars([role({}), role({ org: 'Hidden', visible: false })], { now });
    expect(bars).toHaveLength(1);
  });

  it('produces evenly spaced year ticks covering the span', () => {
    const { ticks } = timelineBars([role({ start: '2013-01', end: '2026-01' })], { now });
    expect(ticks[0]).toBe(2013);
    expect(ticks.at(-1)).toBe(2026);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
  });

  it('returns empty output for no visible roles instead of dividing by zero', () => {
    expect(timelineBars([], { now })).toEqual({ bars: [], ticks: [] });
  });
});
