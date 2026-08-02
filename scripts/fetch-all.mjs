import { run as github } from './fetch-github.mjs';
import { run as openalex } from './fetch-openalex.mjs';
import { run as zenodo } from './fetch-zenodo.mjs';
import { run as crossref } from './fetch-crossref.mjs';

const results = await Promise.allSettled([github(), openalex(), zenodo(), crossref()]);
const failed = results.filter((result) => result.status === 'rejected');

for (const failure of failed) {
  console.warn(`Metric source unavailable: ${failure.reason.message}`);
}

console.log(`Metric sources refreshed: ${results.length - failed.length} of ${results.length}.`);
