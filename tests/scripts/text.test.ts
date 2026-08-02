import { describe, expect, it } from 'vitest';
import { cleanText } from '../../scripts/lib/text.mjs';

describe('cleanText', () => {
  it('strips XML and HTML tags that publishers embed in titles', () => {
    expect(cleanText('<tt>PanPA</tt>: generation of graphs')).toBe('PanPA: generation of graphs');
  });

  it('collapses newlines and indentation into single spaces', () => {
    expect(cleanText('A shift between the\n                    <scp>KIT</scp>\n   states')).toBe(
      'A shift between the KIT states',
    );
  });

  it('replaces non-breaking spaces with ordinary spaces', () => {
    const nbsp = String.fromCharCode(0x00a0);
    expect(cleanText(`Foo${nbsp}bar`)).toBe('Foo bar');
  });

  it('replaces en and em dashes with a hyphen so the tracked cache stays plain', () => {
    const en = String.fromCharCode(0x2013);
    const em = String.fromCharCode(0x2014);
    expect(cleanText(`Infrastructure ${en} de.NBI`)).toBe('Infrastructure - de.NBI');
    expect(cleanText(`one${em}two`)).toBe('one-two');
  });

  it('removes a space left before punctuation after tag removal', () => {
    expect(cleanText('<tt>PanPA</tt> : generation')).toBe('PanPA: generation');
  });

  it('passes non-string values through untouched', () => {
    expect(cleanText(null)).toBeNull();
    expect(cleanText(undefined)).toBeUndefined();
  });
});
