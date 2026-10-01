// Gallery photos. Any image placed in src/assets/gallery/ (JPEG, PNG or
// WebP — ideally ~2000px on the long side and under ~400 KB) is shown
// automatically, sorted by file name: prefix names with 01-, 02-… to choose
// the order. The caption (also the alt text, which matters for image
// search) comes from the file name — "02-le-salon.jpg" becomes "Le salon" —
// unless you give translated captions below.
//
// While the folder is empty the gallery shows framed placeholders.

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Optional captions per file, in each language. Example:
//   "01-facade.jpg": {
//     fr: "La façade du Château de Voltaire",
//     en: "The façade of the Château de Voltaire",
//     de: "Die Fassade des Schlosses Voltaire",
//     ru: "Фасад замка Вольтера",
//   },
export const captions = {};

const dir = join(dirname(fileURLToPath(import.meta.url)), "assets", "gallery");

const fromFileName = (file) => {
  const words = file.replace(/\.[^.]+$/, "").replace(/^\d+[-_ ]*/, "").replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const photos = readdirSync(dir)
  .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((file) => ({ file, caption: captions[file] || { fr: fromFileName(file) } }));
