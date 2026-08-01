import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Checks the real outcome (does git actually ignore the path) rather than the
// wording of .gitignore, so the test still holds if the patterns are rewritten.
const isIgnored = (path: string) => {
  try {
    execFileSync('git', ['check-ignore', '-q', path]);
    return true;
  } catch {
    return false;
  }
};

describe('repository hygiene', () => {
  it('ignores every local working directory and instruction file', () => {
    for (const path of [
      'docs/notes/',
      '.local-tooling/',
      '.editor-session/',
      'CONVENTIONS.md',
      'Sanjay_Srikakulam_CV.pdf',
      'node_modules/',
      'dist/',
    ]) {
      expect(isIgnored(path)).toBe(true);
    }
  });

  it('keeps the files the published site and its pipeline need', () => {
    for (const path of ['README.md', '.github/workflows/ci.yml', 'package.json']) {
      expect(isIgnored(path)).toBe(false);
    }
  });

  it('declares the expected toolchain', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.dependencies.astro).toMatch(/^\^7\./);
    expect(pkg.dependencies.zod).toMatch(/^\^4\./);
    expect(pkg.scripts.test).toBe('vitest run');
  });

  it('has a global stylesheet carrying the design tokens', () => {
    expect(existsSync('src/styles/global.css')).toBe(true);
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toContain('#2f5bea');
    expect(css).toContain('prefers-reduced-motion');
  });
});
