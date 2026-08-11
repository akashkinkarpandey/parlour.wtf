import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://parlour.wtf',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
    // Custom entrypoint so the PresenceRoom Durable Object class is a real
    // top-level export of the Worker (required for wrangler to bind it) --
    // see src/worker.ts.
    workerEntryPoint: { path: 'src/worker.ts', namedExports: ['PresenceRoom'] },
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
