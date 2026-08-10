import sharp from 'sharp';
import fs from 'node:fs';

const svgSrc = fs.readFileSync(new URL('../public/favicon.svg', import.meta.url));
const outDir = new URL('../public/', import.meta.url);
const toPath = (name) => new URL(name, outDir).pathname.replace(/^\//, '');

// Standard "any" purpose icons — full-bleed artwork.
await sharp(svgSrc, { density: 384 }).resize(192, 192).png().toFile(toPath('icon-192.png'));
await sharp(svgSrc, { density: 384 }).resize(512, 512).png().toFile(toPath('icon-512.png'));

// Maskable icon — OS launchers crop to a circle/squircle, so the glyph
// needs to sit inside the inner ~80% "safe zone" on a full-bleed
// background (the badge gradient's own start color).
const size = 512;
const glyphSize = Math.round(size * 0.68);
const badge = await sharp(svgSrc, { density: 384 })
  .resize(glyphSize, glyphSize)
  .png()
  .toBuffer();
await sharp({
  create: { width: size, height: size, channels: 4, background: '#6a1f22' },
})
  .composite([{ input: badge, gravity: 'center' }])
  .png()
  .toFile(toPath('icon-maskable-512.png'));

console.log('PWA icons written: icon-192.png, icon-512.png, icon-maskable-512.png');
