/**
 * Normalises a text field fetched from an external record so the committed
 * cache and the rendered page stay plain. Strips XML and HTML tags that
 * publishers embed in titles, folds non-breaking spaces, newlines, and runs of
 * whitespace into single spaces, replaces en and em dashes with a hyphen, and
 * drops a space left before punctuation once a tag has been removed. Non-string
 * values (a null title, for example) pass through untouched.
 *
 * @param {unknown} input
 * @returns {unknown}
 */
export function cleanText(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<[^>]+>/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([:;,.!?])/g, '$1')
    .trim();
}
