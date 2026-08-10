import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname.replace(/^\//, '');
const src = `${root}/ParlourImage.png`;
const outDir = `${root}/src/assets`;
const publicDir = `${root}/public`;

const meta = await sharp(src).metadata();
console.log('source', meta.width, 'x', meta.height);

await sharp(src)
  .resize({ width: 1920, withoutEnlargement: true })
  .avif({ quality: 55, effort: 6 })
  .toFile(`${outDir}/hero.avif`);

await sharp(src)
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 78 })
  .toFile(`${outDir}/hero.webp`);

await sharp(src)
  .resize({ width: 1920, withoutEnlargement: true })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(`${outDir}/hero.jpg`);

const w = meta.width, h = meta.height;
const targetAspect = 9 / 16;
const cropH = h;
const cropW = Math.min(w, Math.round(cropH * targetAspect));
const focalX = Math.round(w * 0.35);
let left = focalX - Math.round(cropW / 2);
if (left < 0) left = 0;
if (left + cropW > w) left = w - cropW;

console.log('mobile crop', { left, top: 0, width: cropW, height: cropH });

await sharp(src)
  .extract({ left, top: 0, width: cropW, height: cropH })
  .resize({ width: 828 })
  .avif({ quality: 50, effort: 6 })
  .toFile(`${outDir}/hero-mobile.avif`);

await sharp(src)
  .extract({ left, top: 0, width: cropW, height: cropH })
  .resize({ width: 828 })
  .webp({ quality: 74 })
  .toFile(`${outDir}/hero-mobile.webp`);

await sharp(src)
  .extract({ left, top: 0, width: cropW, height: cropH })
  .resize({ width: 828 })
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile(`${outDir}/hero-mobile.jpg`);

await sharp(src)
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'center' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(`${publicDir}/og.jpg`);

// Album art — a square from the retro poster area on the upper-left wall
// (the woman-with-earrings vintage Filmfare-style print). Reads like a
// mini album cover when scaled down to 128px.
const artLeft = Math.round(w * 0.243);
const artTop = Math.round(h * 0.008);
const artSize = Math.round(h * 0.24);
await sharp(src)
  .extract({ left: artLeft, top: artTop, width: artSize, height: artSize })
  .resize({ width: 256, height: 256 })
  .webp({ quality: 88 })
  .toFile(`${outDir}/album-art.webp`);
await sharp(src)
  .extract({ left: artLeft, top: artTop, width: artSize, height: artSize })
  .resize({ width: 256, height: 256 })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(`${outDir}/album-art.jpg`);

console.log('done');
