// Resolves the site's optional Umami configuration into the attributes the
// tracker tag needs, or null when analytics are not configured. Keeping the
// on/off decision here (rather than in the Astro components) means the script
// tag, the click-event attributes, and the footer disclosure all agree, and the
// logic is unit-testable.
//
// Umami sets no cookies and stores no personal data, so no consent banner is
// needed; the feature is simply absent until a umami block is set in site.yml.

export interface UmamiConfig {
  script_url: string;
  website_id: string;
  domains?: string[];
}

export interface AnalyticsConfig {
  umami?: UmamiConfig;
}

export interface Analytics {
  // The self-hosted tracker script, e.g. https://umami.example.com/script.js.
  scriptUrl: string;
  // The website UUID from the Umami dashboard, rendered as data-website-id.
  websiteId: string;
  // Comma-joined hostnames for data-domains, or undefined when unrestricted so
  // the attribute is omitted rather than rendered empty. This is an exact
  // hostname match: the tracker does no-op entirely on any host not listed.
  domains?: string;
}

export function getAnalytics(site: { analytics?: AnalyticsConfig }): Analytics | null {
  const umami = site.analytics?.umami;
  const scriptUrl = umami?.script_url?.trim();
  const websiteId = umami?.website_id?.trim();
  if (!scriptUrl || !websiteId) return null;

  const domains = (umami?.domains ?? []).map((domain) => domain.trim()).filter(Boolean);
  return {
    scriptUrl,
    websiteId,
    domains: domains.length > 0 ? domains.join(',') : undefined,
  };
}
