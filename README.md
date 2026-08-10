# parlour.wtf — Khoobsurati

A single-page ambient site: one illustrated ladies’ parlour, a live "online"
counter, and links out to a curated 90s Bollywood playlist. Sister site to
`saloon.wtf`.

## Stack

- Astro 5 (SSR on Cloudflare)
- TypeScript, no framework runtime
- Cloudflare Pages / Workers (`@astrojs/cloudflare` adapter)
- Upstash Redis REST for the presence counter

## Develop

```bash
npm install
cp .env.example .env    # fill in Upstash creds (optional in dev)
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

One-time secrets for the presence counter (site works without them —
counter just shows `1`):

```bash
npm run secrets
```

## Content edits

Everything editorial lives in [`src/config/site.ts`](src/config/site.ts):
playlist URLs, the shared-listening epoch, and the track list used to compute
"what’s currently playing".
"# parlour.wtf" 
