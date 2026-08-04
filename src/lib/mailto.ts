// Builds a mailto: URL with an optional prefilled subject and body, used by the
// /c/m business-card route. Encoding is done with encodeURIComponent rather than
// URLSearchParams on purpose: URLSearchParams encodes spaces as `+`, which some
// mail clients render as literal plus signs in the subject/body. encodeURIComponent
// yields %20 for spaces and %0A for newlines, which every client decodes correctly.

export interface MailtoFields {
  subject?: string;
  body?: string;
}

export function buildMailto(email: string, fields: MailtoFields = {}): string {
  const params: string[] = [];
  if (fields.subject) params.push(`subject=${encodeURIComponent(fields.subject)}`);
  if (fields.body) params.push(`body=${encodeURIComponent(fields.body)}`);
  return `mailto:${email}${params.length ? `?${params.join('&')}` : ''}`;
}
