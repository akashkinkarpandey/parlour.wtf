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
  build: {
    // Keep CSS as external, hashed files (never inlined into HTML) so the
    // Content-Security-Policy can require style-src 'self' without
    // 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
