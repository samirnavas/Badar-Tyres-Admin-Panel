import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "pwa");

mkdirSync(outDir, { recursive: true });

const BRAND = "#dc2626";
const WHITE = "#ffffff";

function buildSvg(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.18) : Math.round(size * 0.12);
  const inner = size - padding * 2;
  const fontSize = Math.round(inner * 0.34);
  const radius = maskable ? 0 : Math.round(size * 0.12);

  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND}" />
      <text
        x="50%"
        y="54%"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${WHITE}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        letter-spacing="-2"
      >BT</text>
    </svg>
  `);
}

async function writeIcon(name, size, maskable = false) {
  const png = await sharp(buildSvg(size, maskable)).png().toBuffer();
  writeFileSync(join(outDir, name), png);
}

await writeIcon("icon-192.png", 192);
await writeIcon("icon-512.png", 512);
await writeIcon("icon-maskable-512.png", 512, true);

console.log("Generated PWA icons in public/pwa/");
