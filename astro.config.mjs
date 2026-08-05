import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://sanjay.srikakulam.de',
  // Keep two kinds of page out of the sitemap: the /cv print route (a document
  // rendering of the same data, not worth indexing separately) and the /c/*
  // business-card landing routes (noindex redirect pages for the printed QR
  // codes: sitemapping a noindex page is contradictory).
  integrations: [sitemap({ filter: (page) => !page.includes('/cv') && !page.includes('/c/') })],
  vite: { plugins: [tailwind()] },
});
