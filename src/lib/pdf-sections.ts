import type { Site } from '../schemas/site';

export function pdfSectionOrder(site: Site): string[] {
  return site.pdf.sections;
}

export function capItems<T>(items: T[], site: Site, section: string): T[] {
  const limit = site.pdf.max_items[section];
  return limit === undefined ? items : items.slice(0, limit);
}
