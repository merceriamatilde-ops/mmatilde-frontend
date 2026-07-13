import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public', 'logo-merceria.svg');
const outPath = path.join(root, 'public', 'og-default.png');

const W = 1200;
const H = 630;

const logo = await sharp(svgPath)
  .resize(720, null, { fit: 'inside' })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: { r: 255, g: 248, b: 245, alpha: 1 },
  },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(outPath);

console.log('Wrote', outPath);
