// Wiring for the /c contact hub — the single business-card QR target. Each action
// fires directly from the hub (no intermediary landing page): the hub's own
// pageview records the scan, so one tap reaches email, website, or save-contact.
// Kept as a pure function so the hrefs, umami event names, and primary-action
// choice are unit-testable without rendering the Astro page.

import { buildMailto } from './mailto';

export interface HubProfile {
  email?: string;
  email_subject?: string;
  email_body?: string;
}

export interface HubAction {
  key: 'website' | 'email' | 'save';
  label: string;
  sub: string;
  href: string;
  download?: string;
  // Umami click-through event, omitted when analytics are not configured.
  event?: string;
  // The primary action is elevated (accent) and floated to the top in the UI.
  primary?: boolean;
}

export function buildHubActions(profile: HubProfile, opts: { analytics: boolean }): HubAction[] {
  const ev = (name: string) => (opts.analytics ? name : undefined);
  const actions: HubAction[] = [];

  actions.push({
    key: 'website',
    label: 'Visit website',
    sub: 'projects, publications & CV',
    href: '/',
    event: ev('card-website'),
  });

  // Only offer email when an address is configured; the mailto opens the visitor's
  // mail client prefilled with the optional subject/body from data/site.yml.
  if (profile.email) {
    actions.push({
      key: 'email',
      label: 'Send email',
      sub: 'opens ready to write',
      href: buildMailto(profile.email, {
        subject: profile.email_subject,
        body: profile.email_body,
      }),
      event: ev('card-email'),
      primary: true,
    });
  }

  actions.push({
    key: 'save',
    label: 'Save contact',
    sub: 'adds me to your phone',
    href: '/contact.vcf',
    download: 'Sanjay_Srikakulam.vcf',
    event: ev('card-vcard'),
  });

  return actions;
}
