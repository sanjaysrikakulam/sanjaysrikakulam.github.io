import { describe, expect, it } from 'vitest';
import { formatAuthors } from '../../scripts/lib/authors.mjs';

describe('formatAuthors', () => {
  it('renders a given and family name as surname followed by initials', () => {
    expect(formatAuthors([{ given: 'Sanjay Kumar', family: 'Srikakulam' }])).toBe('Srikakulam SK');
  });

  it('joins several authors with commas in order', () => {
    expect(
      formatAuthors([
        { given: 'Sanjay Kumar', family: 'Srikakulam' },
        { given: 'Sebastian', family: 'Keller' },
      ]),
    ).toBe('Srikakulam SK, Keller S');
  });

  it('collapses given names already written as periodded initials', () => {
    expect(formatAuthors([{ given: 'S. K.', family: 'Srikakulam' }])).toBe('Srikakulam SK');
  });

  it('takes one initial per token of a hyphenated given name', () => {
    expect(formatAuthors([{ given: 'Sylvie-Vivienne', family: 'Barysch' }])).toBe('Barysch SV');
  });

  it('uses a family name alone when there is no given name', () => {
    expect(formatAuthors([{ family: 'Consortium' }])).toBe('Consortium');
  });

  it('uses a group author name verbatim', () => {
    expect(formatAuthors([{ name: 'The Galaxy Community' }])).toBe('The Galaxy Community');
  });

  it('skips authors that carry neither a family name nor a group name', () => {
    expect(formatAuthors([{ given: 'Orphan' }, { given: 'Sebastian', family: 'Keller' }])).toBe(
      'Keller S',
    );
  });

  it('returns an empty string for an empty author list', () => {
    expect(formatAuthors([])).toBe('');
  });
});
