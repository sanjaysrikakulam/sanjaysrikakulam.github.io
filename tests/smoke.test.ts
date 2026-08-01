import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

describe('repository hygiene', () => {
  it('ignores every path that must never be committed', () => {
    const ignored = readFileSync('.gitignore', 'utf8');
    for (const path of [
      'docs/superpowers/',
      '.superpowers/',
      '.claude/',
      'CLAUDE.md',
      '/Sanjay_Srikakulam_CV.pdf',
      'node_modules/',
      'dist/',
    ]) {
      expect(ignored).toContain(path);
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
