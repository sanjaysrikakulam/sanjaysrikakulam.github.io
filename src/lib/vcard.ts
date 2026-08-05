// Builds a vCard from the site profile for the /c hub's save-contact action.
// Version 3.0 is
// used deliberately: it is the most broadly compatible with iOS Contacts,
// Android, and Outlook. Keeping the string-building here (rather than in the
// endpoint) makes escaping and the name split unit-testable.
import type { Site } from '../schemas/site';

export interface VCardOptions {
  // Absolute site URL, e.g. Astro.site.href, added as a URL line when present.
  url?: string;
}

// Escapes a value per RFC 6350 §3.4: backslash, comma, semicolon, and newline.
function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

// Splits a display name into family (last token) and given (the rest). vCard's
// structured N field wants them separated; a single-token name has no family.
export function splitName(name: string): { given: string; family: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { given: parts[0] ?? '', family: '' };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') };
}

export function buildVCard(site: Site, options: VCardOptions = {}): string {
  const { profile, links } = site;
  const { given, family } = splitName(profile.name);
  const prefix = profile.prefix?.trim() ?? '';
  const fullName = [prefix, profile.name].filter(Boolean).join(' ');

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push(`N:${escapeValue(family)};${escapeValue(given)};;${escapeValue(prefix)};`);
  lines.push(`FN:${escapeValue(fullName)}`);
  if (profile.title) lines.push(`TITLE:${escapeValue(profile.title)}`);
  if (profile.org) lines.push(`ORG:${escapeValue(profile.org)}`);
  if (profile.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeValue(profile.email)}`);
  if (options.url) lines.push(`URL:${escapeValue(options.url)}`);
  if (links.orcid) lines.push(`URL:${escapeValue(links.orcid)}`);
  lines.push('END:VCARD');

  // vCard lines are CRLF-delimited, with a trailing CRLF after END.
  return lines.join('\r\n') + '\r\n';
}
