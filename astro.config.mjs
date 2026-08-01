import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://sanjaysrikakulam.github.io',
  vite: { plugins: [tailwind()] },
});
