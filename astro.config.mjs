import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://sanjaysrikakulam.github.io',
  // The print route is a document rendering of the same data, not a page
  // worth indexing separately, so it stays out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/cv') })],
  vite: { plugins: [tailwind()] },
});
