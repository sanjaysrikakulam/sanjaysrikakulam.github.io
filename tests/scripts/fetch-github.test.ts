import { describe, expect, it, vi } from 'vitest';
import { fetchGithub } from '../../scripts/fetch-github.mjs';

const repoPayload = (over = {}) => ({
  stargazers_count: 378,
  forks_count: 125,
  language: 'Shell',
  pushed_at: '2023-11-24T00:00:00Z',
  html_url: 'https://github.com/kalininalab/alphafold_non_docker',
  ...over,
});

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe('fetchGithub', () => {
  it('collects per-repository statistics keyed by owner/name', async () => {
    const fetchImpl = vi.fn(async () => ok(repoPayload()));
    const result = await fetchGithub({
      repos: ['kalininalab/alphafold_non_docker'],
      login: 'sanjaysrikakulam',
      orgs: [],
      fetchImpl,
    });
    expect(result.repos['kalininalab/alphafold_non_docker']).toEqual({
      stars: 378,
      forks: 125,
      language: 'Shell',
      pushed_at: '2023-11-24T00:00:00Z',
      url: 'https://github.com/kalininalab/alphafold_non_docker',
    });
  });

  it('counts merged pull requests in total and per organisation', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('search/issues')) {
        return ok({ total_count: url.includes('org%3Ausegalaxy-eu') ? 387 : 434 });
      }
      return ok(repoPayload());
    });
    const result = await fetchGithub({
      repos: [],
      login: 'sanjaysrikakulam',
      orgs: ['usegalaxy-eu'],
      fetchImpl,
    });
    expect(result.contributions.total).toBe(434);
    expect(result.contributions.byOrg['usegalaxy-eu']).toBe(387);
  });

  it('skips a repository that returns 404 without failing the whole fetch', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('gone') ? { ok: false, status: 404, json: async () => ({}) } : ok(repoPayload()),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await fetchGithub({
      repos: ['owner/gone', 'owner/present'],
      login: 'x',
      orgs: [],
      fetchImpl,
    });
    expect(result.repos['owner/gone']).toBeUndefined();
    expect(result.repos['owner/present']).toBeDefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('owner/gone'));
    warn.mockRestore();
  });

  it('sends the authorization header when a token is supplied', async () => {
    const fetchImpl = vi.fn(async () => ok(repoPayload()));
    await fetchGithub({ repos: ['a/b'], login: 'x', orgs: [], token: 'secret', fetchImpl });
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret');
  });

  it('omits the authorization header when no token is supplied', async () => {
    const fetchImpl = vi.fn(async () => ok(repoPayload()));
    await fetchGithub({ repos: ['a/b'], login: 'x', orgs: [], fetchImpl });
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
