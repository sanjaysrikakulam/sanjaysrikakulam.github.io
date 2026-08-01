import * as yaml from 'js-yaml';

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type Entry = Record<string, unknown>;

/**
 * Builds a parser for Astro's file() loader. The loader requires a unique id
 * per entry; deriving it here keeps the data files free of bookkeeping fields.
 */
export function yamlArrayParser(idFrom: (entry: Entry, index: number) => string) {
  return (text: string): Entry[] => {
    // CORE_SCHEMA keeps every scalar a string, number, boolean, or null. The
    // default schema coerces date-like scalars into Date objects, which would
    // turn a mistyped 2025-09-01 into a Date and produce a confusing regex error.
    // js-yaml 5 throws on a file with no document (empty, blank, or comments
    // only) where js-yaml 4 returned undefined, so treat that as an empty list.
    const hasDocument = text.replace(/^\s*#.*$/gm, '').trim() !== '';
    const parsed = hasDocument ? (yaml.load(text, { schema: yaml.CORE_SCHEMA }) ?? []) : [];
    if (!Array.isArray(parsed)) {
      throw new Error('Expected a YAML list at the top level of the file');
    }
    const seen = new Set<string>();
    return parsed.map((entry, index) => {
      const record = entry as Entry;
      const id = slugify(idFrom(record, index)) || String(index);
      if (seen.has(id)) {
        throw new Error(`Duplicate entry id "${id}". Two entries resolve to the same identifier.`);
      }
      seen.add(id);
      return { id, ...record };
    });
  };
}
