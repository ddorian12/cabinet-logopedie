// astro.config.ts
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://exemplu.ro',
  output: 'server',
  adapter: vercel({}),             // ✅ trece un obiect (poate fi gol)
  vite: { plugins: [tailwindcss()] },
  integrations: [sitemap()],
});
