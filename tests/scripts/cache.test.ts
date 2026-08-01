import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCache, writeCache, withFallback } from '../../scripts/lib/cache.mjs';

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cache-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('readCache', () => {
  it('returns an empty object when the file does not exist', () => {
    expect(readCache('github', dir)).toEqual({});
  });

  it('reads previously written data', () => {
    writeCache('github', { a: 1 }, dir);
    expect(readCache('github', dir)).toEqual({ a: 1 });
  });

  it('returns an empty object when the file is corrupt instead of throwing', () => {
    writeFileSync(join(dir, 'github.json'), '{ not json');
    expect(readCache('github', dir)).toEqual({});
  });
});

describe('writeCache', () => {
  it('creates the directory when missing', () => {
    const nested = join(dir, 'deep', 'deeper');
    writeCache('zenodo', { ok: true }, nested);
    expect(existsSync(join(nested, 'zenodo.json'))).toBe(true);
  });

  it('writes stable key-sorted formatting so diffs stay small', () => {
    writeCache('x', { b: 2, a: 1 }, dir);
    expect(readFileSync(join(dir, 'x.json'), 'utf8')).toBe('{\n  "a": 1,\n  "b": 2\n}\n');
  });
});

describe('withFallback', () => {
  it('returns the fetched value when the fetcher resolves', async () => {
    const result = await withFallback('gh', async () => ({ v: 'fresh' }), { v: 'old' });
    expect(result).toEqual({ value: { v: 'fresh' }, stale: false });
  });

  it('returns the cached value and flags it stale when the fetcher rejects', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await withFallback(
      'gh',
      async () => {
        throw new Error('rate limited');
      },
      { v: 'old' },
    );
    expect(result).toEqual({ value: { v: 'old' }, stale: true });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('gh'));
    warn.mockRestore();
  });

  it('throws when the fetcher fails and there is nothing cached', async () => {
    await expect(
      withFallback(
        'gh',
        async () => {
          throw new Error('boom');
        },
        undefined,
      ),
    ).rejects.toThrow(/gh/);
  });
});
