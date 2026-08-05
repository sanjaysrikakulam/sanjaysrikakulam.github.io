import { describe, expect, it } from 'vitest';
import { buildHubActions } from '../../src/lib/card-hub';
import { loadSite } from '../../src/lib/site';

// The /c contact hub (the single business-card QR target) offers three actions
// that fire directly from the page: email, website, save-contact. buildHubActions
// is the wiring — hrefs, umami event names, and which action is primary — kept as
// a pure function so it is testable without rendering the Astro page (Playwright
// e2e cannot run in this box).

const profile = {
  email: 'me@example.com',
  email_subject: 'Hello there',
  email_body: 'Line one\nLine two',
};

describe('buildHubActions', () => {
  it('returns website, email, save in that DOM order', () => {
    const keys = buildHubActions(profile, { analytics: true }).map((a) => a.key);
    expect(keys).toEqual(['website', 'email', 'save']);
  });

  it('marks email as the primary action', () => {
    const actions = buildHubActions(profile, { analytics: true });
    expect(actions.find((a) => a.key === 'email')?.primary).toBe(true);
    expect(actions.find((a) => a.key === 'website')?.primary).toBeFalsy();
    expect(actions.find((a) => a.key === 'save')?.primary).toBeFalsy();
  });

  it('builds the email action as a prefilled mailto (spaces as %20, newlines as %0A)', () => {
    const email = buildHubActions(profile, { analytics: true }).find((a) => a.key === 'email');
    expect(email?.href).toBe(
      'mailto:me@example.com?subject=Hello%20there&body=Line%20one%0ALine%20two',
    );
    expect(email?.href).not.toContain('+');
  });

  it('points website at the home page and save at the vCard download', () => {
    const actions = buildHubActions(profile, { analytics: true });
    const website = actions.find((a) => a.key === 'website');
    const save = actions.find((a) => a.key === 'save');
    expect(website?.href).toBe('/');
    expect(save?.href).toBe('/contact.vcf');
    expect(save?.download).toMatch(/\.vcf$/);
  });

  it('sets card-* umami events when analytics is enabled', () => {
    const actions = buildHubActions(profile, { analytics: true });
    expect(actions.find((a) => a.key === 'website')?.event).toBe('card-website');
    expect(actions.find((a) => a.key === 'email')?.event).toBe('card-email');
    expect(actions.find((a) => a.key === 'save')?.event).toBe('card-vcard');
  });

  it('omits umami events when analytics is disabled', () => {
    const actions = buildHubActions(profile, { analytics: false });
    expect(actions.every((a) => a.event === undefined)).toBe(true);
  });

  it('omits the email action entirely when no email is configured', () => {
    const keys = buildHubActions({}, { analytics: true }).map((a) => a.key);
    expect(keys).toEqual(['website', 'save']);
  });

  it('wires the real site profile: email present and primary', () => {
    const actions = buildHubActions(loadSite().profile, { analytics: true });
    const email = actions.find((a) => a.key === 'email');
    expect(email?.primary).toBe(true);
    expect(email?.href.startsWith('mailto:s.srikakulam@fz-juelich.de')).toBe(true);
  });
});
