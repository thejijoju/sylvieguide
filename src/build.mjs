// Builds the static site into ../dist: one folder per language, localized
// slugs, sitemap with hreflang alternates, robots.txt and a 404 page.
// No dependencies — run with `node src/build.mjs`.

import { mkdir, writeFile, rm, cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { site, languages, pages } from "./config.mjs";
import { favicon } from "./art.mjs";
import {
  pathFor, urlFor,
  homePage, toursPage, aboutPage, galleryPage, galleryImages, practicalPage, contactPage, notFoundPage, rootPage,
} from "./templates.mjs";

import fr from "./i18n/fr.mjs";
import en from "./i18n/en.mjs";
import de from "./i18n/de.mjs";
import ru from "./i18n/ru.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "dist");
const all = { fr, en, de, ru };
const renderers = { home: homePage, tours: toursPage, about: aboutPage, gallery: galleryPage, practical: practicalPage, contact: contactPage };

checkTranslations();

// Social images and the touch icon live in src/assets (made by `npm run og`)
// and are copied along with the CSS and JS.
await rm(out, { recursive: true, force: true });
await mkdir(join(out, "assets"), { recursive: true });

const write = async (rel, content) => {
  const file = join(out, rel);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
};

let count = 0;
for (const lang of languages) {
  for (const page of pages) {
    await write(join(pathFor(lang, page), "index.html"), renderers[page](all[lang]));
    count++;
  }
}

await write("index.html", rootPage(all));
await write("404.html", notFoundPage(en));
await cp(join(here, "assets"), join(out, "assets"), { recursive: true });
await write("assets/favicon.svg", favicon);

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages
  .flatMap((page) =>
    languages.map(
      (lang) => `  <url>
    <loc>${urlFor(lang, page)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page === "home" || page === "tours" ? "monthly" : "yearly"}</changefreq>
    <priority>${page === "home" ? "1.0" : page === "tours" || page === "contact" ? "0.9" : "0.7"}</priority>
${languages.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l, page)}"/>`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${page === "home" ? `${site.origin}/` : urlFor("en", page)}"/>
${imageEntries(lang, page)}  </url>`,
    ),
  )
  .join("\n")}
</urlset>
`;
await write("sitemap.xml", sitemap);

// Gallery photos are listed in the image sitemap for the gallery page (all)
// and the home page (the three it shows), so they can rank in image search.
function imageEntries(lang, page) {
  if (page !== "gallery" && page !== "home") return "";
  const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return galleryImages(all[lang])
    .slice(0, page === "home" ? 3 : undefined)
    .map((img) => `    <image:image><image:loc>${xml(img.contentUrl)}</image:loc></image:image>\n`)
    .join("");
}
await write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`);

console.log(`Built ${count} pages + root, 404, sitemap and robots into ${out}`);

// Every language must define the same keys as French, so a missing
// translation fails the build instead of rendering "undefined".
function checkTranslations() {
  const shape = (obj, prefix = "") =>
    Object.entries(obj).flatMap(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (Array.isArray(v)) return [`${key}[${v.length}]`];
      return v && typeof v === "object" ? shape(v, key) : [key];
    });
  const ref = new Set(shape(fr));
  for (const lang of languages.filter((l) => l !== "fr")) {
    const keys = new Set(shape(all[lang]));
    const missing = [...ref].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !ref.has(k));
    if (missing.length || extra.length) {
      throw new Error(`Translation mismatch in ${lang}: missing ${missing.join(", ") || "—"}; extra ${extra.join(", ") || "—"}`);
    }
  }
}
