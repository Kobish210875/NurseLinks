import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "app", "icon.svg");
const svg = fs.readFileSync(svgPath);

const sizes = [16, 32, 48];
const pngBuffers = await Promise.all(
  sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
);

const ico = await toIco(pngBuffers);
fs.writeFileSync(path.join(root, "app", "favicon.ico"), ico);

console.log("Generated app/favicon.ico");
