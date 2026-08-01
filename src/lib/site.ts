import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { siteSchema, type Site } from '../schemas/site';

let cached: Site | null = null;

export function loadSite(): Site {
  if (cached) return cached;
  const raw = yaml.load(readFileSync('data/site.yml', 'utf8'), { schema: yaml.CORE_SCHEMA });
  cached = siteSchema.parse(raw);
  return cached;
}
