// Static vCard download served at /contact.vcf, generated from the site
// profile at build time. The /c/v card route links here with a download
// attribute so the file saves with a friendly name. Editing data/site.yml
// changes the downloaded contact without touching the printed card.
import type { APIRoute } from 'astro';
import { loadSite } from '../lib/site';
import { buildVCard } from '../lib/vcard';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const vcard = buildVCard(loadSite(), { url: site?.href });
  return new Response(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="Sanjay_Srikakulam.vcf"',
    },
  });
};
