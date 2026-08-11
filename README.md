# parlour.wtf — Khoobsurati

A single-page ambient site: one illustrated ladies’ parlour, a live "online"
counter, and links out to a curated 90s Bollywood playlist. Sister site to
`saloon.wtf`.

## Stack

- Astro 5 (SSR on Cloudflare)
- TypeScript, no framework runtime
- Cloudflare Pages / Workers (`@astrojs/cloudflare` adapter)
- A Durable Object (`PresenceRoom`) for the live presence counter — no
  external database, see `src/durable-objects/presence-room.ts`

## Develop

```bash
npm install
npm run dev
```

Hero images live in `src/assets/`. To regenerate the desktop / mobile /
OG crops from `ParlourImage.png`:

```bash
node scripts/prepare-images.mjs
```

## Deploy (Cloudflare)

```bash
npm run deploy            # builds then wrangler deploy
```

Dry run (build + package but don't push):

```bash
npm run deploy:dry
```

## Content edits

Everything editorial lives in [`src/config/site.ts`](src/config/site.ts):
playlist URLs, the shared-listening epoch, and the track list used to compute
"what’s currently playing".
"# parlour.wtf" 
