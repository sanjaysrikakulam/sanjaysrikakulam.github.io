import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import { readCache, writeCache, withFallback } from './lib/cache.mjs';

/**
 * @typedef {object} RepoStat
 * @property {number} stars
 * @property {number} forks
 * @property {string | null} language
 * @property {string} pushed_at
 * @property {string} url
 */

/**
 * @typedef {object} GithubResult
 * @property {Record<string, RepoStat>} repos
 * @property {{ total: number, byOrg: Record<string, number> }} contributions
 */

const API = 'https://api.github.com';

function headers(token) {
  const base = { Accept: 'application/vnd.github+json', 'User-Agent': 'cv-site-build' };
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
}

async function getJson(fetchImpl, url, token) {
  const response = await fetchImpl(url, { headers: headers(token) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function searchCount(fetchImpl, query, token) {
  const url = `${API}/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
  const body = await getJson(fetchImpl, url, token);
  return body.total_count ?? 0;
}

/**
 * @param {{ repos: string[], login: string, orgs: string[], token?: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<GithubResult>}
 */
export async function fetchGithub({ repos, login, orgs, token, fetchImpl = fetch }) {
  const stats = {};
  for (const repo of repos) {
    try {
      const body = await getJson(fetchImpl, `${API}/repos/${repo}`, token);
      stats[repo] = {
        stars: body.stargazers_count,
        forks: body.forks_count,
        language: body.language ?? null,
        pushed_at: body.pushed_at,
        url: body.html_url,
      };
    } catch (error) {
      console.warn(`Skipping repository ${repo}: ${error.message}`);
    }
  }

  const total = await searchCount(fetchImpl, `author:${login} type:pr is:merged`, token);
  const byOrg = {};
  for (const org of orgs) {
    byOrg[org] = await searchCount(
      fetchImpl,
      `author:${login} type:pr is:merged org:${org}`,
      token,
    );
  }

  return { repos: stats, contributions: { total, byOrg } };
}

function repoList() {
  const projects = yaml.load(readFileSync('data/projects.yml', 'utf8'), {
    schema: yaml.CORE_SCHEMA,
  });
  return (projects ?? []).map((project) => project.repo).filter(Boolean);
}

export async function run() {
  const cached = readCache('github');
  const { value, stale } = await withFallback(
    'GitHub',
    () =>
      fetchGithub({
        repos: repoList(),
        login: 'sanjaysrikakulam',
        orgs: ['usegalaxy-eu', 'galaxyproject'],
        token: process.env.GITHUB_TOKEN,
      }),
    Object.keys(cached).length ? cached : undefined,
  );
  if (!stale) writeCache('github', value);
  return value;
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
