import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://parlour.wtf',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  integrations: [sitemap()],
  prefetch: false,
  compressHTML: true,
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
