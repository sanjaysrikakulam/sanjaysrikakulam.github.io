import { describe, expect, it, vi } from 'vitest';
import { fetchGithub } from '../../scripts/fetch-github.mjs';
import { createFetchMock, failedResponse, jsonResponse } from '../helpers/fetch-mock';

const repoPayload = (over = {}) => ({
  stargazers_count: 378,
  forks_count: 125,
  language: 'Shell',
  pushed_at: '2023-11-24T00:00:00Z',
  html_url: 'https://github.com/kalininalab/alphafold_non_docker',
  ...over,
});

describe('fetchGithub', () => {
  it('collects per-repository statistics keyed by owner/name', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(repoPayload()));
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
    const fetchImpl = createFetchMock(async (url) => {
      const href = String(url);
      if (href.includes('search/issues')) {
        return jsonResponse({ total_count: href.includes('org%3Ausegalaxy-eu') ? 387 : 434 });
      }
      return jsonResponse(repoPayload());
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
    const fetchImpl = createFetchMock(async (url) =>
      String(url).includes('gone') ? failedResponse(404) : jsonResponse(repoPayload()),
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
    const fetchImpl = createFetchMock(async () => jsonResponse(repoPayload()));
    await fetchGithub({ repos: ['a/b'], login: 'x', orgs: [], token: 'secret', fetchImpl });
    const [, init] = fetchImpl.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer secret');
  });

  it('omits the authorization header when no token is supplied', async () => {
    const fetchImpl = createFetchMock(async () => jsonResponse(repoPayload()));
    await fetchGithub({ repos: ['a/b'], login: 'x', orgs: [], fetchImpl });
    const [, init] = fetchImpl.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
