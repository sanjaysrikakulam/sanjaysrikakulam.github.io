export type Flagged = {
  visible: boolean;
  featured: boolean;
  in_pdf?: boolean;
  order?: number;
};

export function visibleItems<T extends Flagged>(items: T[]): T[] {
  return items.filter((item) => item.visible);
}

export function featuredItems<T extends Flagged>(items: T[]): T[] {
  return items.filter((item) => item.visible && item.featured);
}

/**
 * `sectionDefault` comes from the pdf block in site.yml. An item's own
 * in_pdf flag overrides it in either direction, but a hidden item is never
 * included.
 */
export function pdfItems<T extends Flagged>(items: T[], sectionDefault: boolean): T[] {
  return items.filter((item) => item.visible && (item.in_pdf ?? sectionDefault));
}

export function sortByOrder<T extends Flagged>(
  items: T[],
  fallback: (a: T, b: T) => number = () => 0,
): T[] {
  return [...items].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return fallback(a, b);
  });
}
