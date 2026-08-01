// Kept free of astro:content so this stays unit testable without booting an
// Astro build. Do not merge this into page-data.ts.
export function splitHeadline(headline: string, accent: string) {
  const index = headline.indexOf(accent);
  if (index === -1) return { before: headline, accent: '', after: '' };
  return {
    before: headline.slice(0, index),
    accent,
    after: headline.slice(index + accent.length),
  };
}
