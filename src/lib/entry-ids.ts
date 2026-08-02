import { slugify } from './slug';

type Entry = Record<string, unknown>;

/**
 * Presenting two posters at one conference in the same year is normal, so
 * name-year-role alone is not enough to tell them apart. title is optional
 * in the schema; only append it when present so an untitled entry does not
 * end up with a trailing separator baked into its id.
 */
export function conferenceId(entry: Entry): string {
  const base = `${entry.name}-${entry.year}-${entry.role}`;
  return entry.title ? `${base}-${entry.title}` : base;
}

/**
 * Two concurrent roles at the same organisation starting the same month are
 * a real scenario, so the job title is what actually distinguishes them.
 */
export function experienceId(entry: Entry): string {
  return `${entry.org}-${entry.start}-${entry.title}`;
}

/**
 * Title, venue, and year are fetched from the DOI, so they are not available
 * when the loader assigns ids. The identifier is, and it is unique per entry,
 * which is why publication identity is derived from it rather than the title.
 */
export function publicationId(entry: Entry): string {
  return String(entry.doi ?? entry.zenodo_doi);
}

/**
 * The timeline bar and the role's detail entry further down the page must
 * share one id so the bar's link actually lands on the entry. Deriving the
 * anchor from experienceId, rather than re-deriving it from org and start
 * alone, means the two can never drift apart.
 */
export function experienceAnchor(entry: Entry): string {
  return `role-${slugify(experienceId(entry))}`;
}
