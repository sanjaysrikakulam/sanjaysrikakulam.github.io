// Resolves the site's optional GoatCounter configuration to a single endpoint,
// or null when analytics are not configured. Keeping the on/off decision here
// (rather than in the Astro components) means the script tag, the no-script
// pixel, and the footer disclosure all agree, and the logic is unit-testable.
//
// GoatCounter sets no cookies and stores no personal data, so no consent banner
// is needed; the feature is simply absent until an endpoint is set in site.yml.

export interface AnalyticsConfig {
  goatcounter?: string;
}

export interface Analytics {
  // The GoatCounter count endpoint, e.g. https://code.goatcounter.com/count.
  // Used both as the script's data-goatcounter and, with `?p=<path>`, as the
  // no-script pixel source.
  endpoint: string;
}

export function getAnalytics(site: { analytics?: AnalyticsConfig }): Analytics | null {
  const endpoint = site.analytics?.goatcounter?.trim();
  if (!endpoint) return null;
  return { endpoint };
}
