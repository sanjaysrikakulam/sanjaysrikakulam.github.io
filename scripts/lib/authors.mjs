/**
 * @typedef {object} Author
 * @property {string} [given]
 * @property {string} [family]
 * @property {string} [name]
 */

function initials(given) {
  if (!given) return '';
  return given
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((token) => token[0].toUpperCase())
    .join('');
}

/**
 * Formats a structured author list into the house style used across the site:
 * a surname followed by its initials with no periods (`Srikakulam SK`), authors
 * joined by commas. A group author (one with a `name` and no `family`, such as
 * `The Galaxy Community`) is used verbatim.
 *
 * @param {Author[]} authors
 * @returns {string}
 */
export function formatAuthors(authors) {
  return authors
    .map((author) => {
      if (author.family) {
        const suffix = initials(author.given);
        return suffix ? `${author.family} ${suffix}` : author.family;
      }
      return author.name ?? '';
    })
    .filter(Boolean)
    .join(', ');
}
