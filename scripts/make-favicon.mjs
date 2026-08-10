import sharp from 'sharp';
import fs from 'node:fs';

const svgSrc = fs.readFileSync(new URL('../public/favicon.svg', import.meta.url));
await sharp(svgSrc, { density: 384 })
  .resize(180, 180)
  .png()
  .toFile(new URL('../public/apple-touch-icon.png', import.meta.url).pathname.replace(/^\//, ''));
console.log('apple-touch-icon.png written');
