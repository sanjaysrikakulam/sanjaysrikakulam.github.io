import type { Publication } from '../schemas/publications';

const ARTICLES = new Set(['a', 'an', 'the', 'on', 'of', 'for', 'in', 'and']);

const ENTRY_TYPE: Record<Publication['type'], string> = {
  journal: 'article',
  conference: 'inproceedings',
  preprint: 'misc',
  deliverable: 'misc',
  'white-paper': 'misc',
  poster: 'misc',
  presentation: 'misc',
  dataset: 'misc',
  software: 'misc',
};

function escapeValue(value: string): string {
  return value.replace(/\\/g, '\\textbackslash{}').replace(/([{}])/g, '\\$1');
}

function firstSurname(entry: Publication): string {
  const authors = entry.authors_display;
  if (!authors) return (entry.venue ?? 'anon').split(/[\s,]+/)[0];
  return authors.split(',')[0].trim().split(/\s+/)[0];
}

function titleWord(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return words.find((word) => !ARTICLES.has(word)) ?? 'untitled';
}

export function citationKey(entry: Publication): string {
  const surname = firstSurname(entry)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${surname}${entry.year}${titleWord(entry.title)}`;
}

export function toBibtex(entry: Publication): string {
  const kind = ENTRY_TYPE[entry.type];
  const venueField =
    kind === 'article' ? 'journal' : kind === 'inproceedings' ? 'booktitle' : 'howpublished';

  const fields: Array<[string, string | undefined]> = [
    ['author', entry.authors_display],
    ['title', entry.title],
    [venueField, entry.venue],
    ['year', String(entry.year)],
    ['doi', entry.doi ?? entry.zenodo_doi],
  ];

  const lines = fields
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `  ${name.padEnd(7)} = {${escapeValue(value as string)}}`);

  return `@${kind}{${citationKey(entry)},\n${lines.join(',\n')}\n}`;
}
