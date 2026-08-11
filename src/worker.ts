// Custom Worker entrypoint. Astro's Cloudflare adapter normally generates
// the whole entrypoint itself (see @astrojs/cloudflare/entrypoints/server.js),
// but a Durable Object class has to be a real top-level export of the final
// Worker module for wrangler to bind it -- so we delegate to the adapter's
// own createExports() for the site's normal fetch handling, then add
// PresenceRoom alongside it. Wired up via `workerEntryPoint` in
// astro.config.mjs.
import { createExports as createServerExports } from '@astrojs/cloudflare/entrypoints/server.js';
import { PresenceRoom } from './durable-objects/presence-room';

export function createExports(manifest: Parameters<typeof createServerExports>[0]) {
  return { ...createServerExports(manifest), PresenceRoom };
}

export { PresenceRoom };
