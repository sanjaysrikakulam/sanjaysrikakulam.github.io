import type { Experience } from '../schemas/experience';
import { experienceAnchor } from './entry-ids';

export type Bar = {
  id: string;
  label: string;
  sublabel?: string;
  left: number;
  width: number;
  colour: string;
  from: string;
  to: string;
};

const FALLBACK_COLOURS = ['#2F5BEA', '#0D9488', '#DC2626', '#D97706', '#7C3AED', '#64748B'];
const MIN_WIDTH = 2;
const TICK_COUNT = 5;

/** Months elapsed since January 1970, so arithmetic stays integer and exact. */
function toMonths(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  return year * 12 + (month - 1);
}

function currentMonth(now: Date): number {
  return now.getUTCFullYear() * 12 + now.getUTCMonth();
}

export function timelineBars(
  roles: Experience[],
  options: { now?: Date } = {},
): { bars: Bar[]; ticks: number[] } {
  const now = options.now ?? new Date();
  const visible = roles.filter((role) => role.visible);
  if (visible.length === 0) return { bars: [], ticks: [] };

  const endMonths = (role: Experience) => (role.end ? toMonths(role.end) : currentMonth(now));

  const ordered = [...visible].sort((a, b) => toMonths(a.start) - toMonths(b.start));
  const first = Math.min(...ordered.map((role) => toMonths(role.start)));
  const last = Math.max(...ordered.map(endMonths));
  const span = Math.max(1, last - first);

  const bars = ordered.map((role, index) => {
    const start = toMonths(role.start);
    const end = endMonths(role);
    const left = ((start - first) / span) * 100;
    const rawWidth = ((end - start) / span) * 100;
    const width = Math.max(MIN_WIDTH, Math.min(rawWidth, 100 - left));
    return {
      id: experienceAnchor(role),
      label: role.org,
      sublabel: role.title,
      left,
      width,
      colour: role.track_colour ?? FALLBACK_COLOURS[index % FALLBACK_COLOURS.length],
      from: role.start,
      to: role.end ?? 'Present',
    };
  });

  const startYear = Math.floor(first / 12);
  const endYear = Math.floor(last / 12);
  const step = Math.max(1, Math.round((endYear - startYear) / (TICK_COUNT - 1)));
  const ticks: number[] = [];
  for (let year = startYear; year < endYear; year += step) ticks.push(year);
  if (ticks.at(-1) !== endYear) ticks.push(endYear);

  return { bars, ticks };
}
