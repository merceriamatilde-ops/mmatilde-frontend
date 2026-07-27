import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFile, unlink } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public', 'favico.svg');
const publicDir = path.join(root, 'public');

// Fondo brand para que se lea bien a 16px en Google (M negra sobre blanco se pierde).
const BRAND = { r: 129, g: 25, b: 77, alpha: 1 }; // brand-800 #81194d

async function renderPngBuffer(size) {
  const glyph = await sharp(svgPath)
    .resize(Math.round(size * 0.72), Math.round(size * 0.72), {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .negate({ alpha: false })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND,
    },
  })
    .composite([{ input: glyph, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function writePng(size, outName) {
  const outPath = path.join(publicDir, outName);
  await writeFile(outPath, await renderPngBuffer(size));
  console.log('Wrote', outPath);
  return outPath;
}

await writePng(48, 'favicon-48.png');
await writePng(192, 'favicon-192.png');
await writePng(180, 'apple-touch-icon.png');

// /favicon.ico real: antes en prod el SPA devolvía index.html y Google no lo usaba.
const tmp = [];
for (const size of [16, 32, 48]) {
  const p = path.join(publicDir, `_ico-${size}.png`);
  await writeFile(p, await renderPngBuffer(size));
  tmp.push(p);
}
const ico = await pngToIco(tmp);
await writeFile(path.join(publicDir, 'favicon.ico'), ico);
console.log('Wrote', path.join(publicDir, 'favicon.ico'), `(${ico.length} bytes)`);
await Promise.all(tmp.map((p) => unlink(p).catch(() => {})));
