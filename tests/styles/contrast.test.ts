import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const AA_NORMAL_TEXT = 4.5;

function extractThemeBlock(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) {
    throw new Error(`selector not found in stylesheet: ${selector}`);
  }
  const braceStart = css.indexOf('{', start);
  const braceEnd = css.indexOf('}', braceStart);
  return css.slice(braceStart, braceEnd);
}

function extractToken(block: string, name: string): string {
  const re = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`);
  const match = block.match(re);
  if (!match) {
    throw new Error(`token --${name} not found in block`);
  }
  return match[1];
}

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

// WCAG relative luminance: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG contrast ratio: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

const css = readFileSync('src/styles/global.css', 'utf8');

const lightBlock = extractThemeBlock(css, '@theme');
const darkBlock = extractThemeBlock(css, "[data-theme='dark']");

const tokenNames = [
  'color-ink',
  'color-ink-2',
  'color-ink-3',
  'color-bg',
  'color-surface',
  'color-accent',
];

type Tokens = Record<string, string>;

function readTokens(block: string): Tokens {
  const tokens: Tokens = {};
  for (const name of tokenNames) {
    tokens[name] = extractToken(block, name);
  }
  return tokens;
}

const themes: Array<{ label: string; tokens: Tokens }> = [
  { label: 'light', tokens: readTokens(lightBlock) },
  { label: 'dark', tokens: readTokens(darkBlock) },
];

const textTokens = ['color-ink', 'color-ink-2', 'color-ink-3'];
const backgroundTokens = ['color-bg', 'color-surface'];

describe('design token contrast (WCAG 2.1 AA)', () => {
  for (const { label, tokens } of themes) {
    describe(`${label} theme`, () => {
      for (const textToken of textTokens) {
        for (const bgToken of backgroundTokens) {
          it(`${textToken} on ${bgToken} clears ${AA_NORMAL_TEXT}:1`, () => {
            const ratio = contrastRatio(tokens[textToken], tokens[bgToken]);
            expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
          });
        }
      }

      it(`color-accent on color-bg clears ${AA_NORMAL_TEXT}:1`, () => {
        const ratio = contrastRatio(tokens['color-accent'], tokens['color-bg']);
        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });
    });
  }
});
