import { describe, expect, it } from 'vitest';
import { splitHeadline } from '../../src/lib/headline';

describe('splitHeadline', () => {
  it('splits around the accent word', () => {
    expect(
      splitHeadline(
        'Computational methods for biology, and the infrastructure that runs them.',
        'infrastructure',
      ),
    ).toEqual({
      before: 'Computational methods for biology, and the ',
      accent: 'infrastructure',
      after: ' that runs them.',
    });
  });

  it('splits on the first occurrence only', () => {
    expect(splitHeadline('a b a', 'a')).toEqual({ before: '', accent: 'a', after: ' b a' });
  });

  it('returns the whole string as before when the accent is absent', () => {
    expect(splitHeadline('no match here', 'zzz')).toEqual({
      before: 'no match here',
      accent: '',
      after: '',
    });
  });
});
