import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/favicon.svg"));

const pngs = await Promise.all(
  [16, 32, 48].map((size) => sharp(svg).resize(size, size).png().toBuffer()),
);

const ico = await toIco(pngs);
writeFileSync(join(root, "app/favicon.ico"), ico);
writeFileSync(join(root, "public/favicon.ico"), ico);
await sharp(svg).resize(96, 96).png().toFile(join(root, "public/favicon-96x96.png"));
await sharp(svg).resize(180, 180).png().toFile(join(root, "public/apple-touch-icon.png"));

console.log("Generated app/favicon.ico, public/favicon.ico, public/favicon-96x96.png, public/apple-touch-icon.png");
