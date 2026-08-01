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
