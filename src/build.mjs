// Builds the static site into ../dist: one folder per language, localized
// slugs, sitemap with hreflang alternates, robots.txt and a 404 page.
// No dependencies — run with `node src/build.mjs`.

import { mkdir, writeFile, rm, cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { site, languages, pages, langMeta } from "./config.mjs";
import { photos, details } from "./gallery.mjs";
import {
  pathFor, urlFor,
  homePage, toursPage, aboutPage, galleryPage, landingPage, voltairePage, pricesPage, galleryImages, VIDEOS, practicalPage, contactPage, notFoundPage, rootPage,
} from "./templates.mjs";


const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "dist");
// Every language that has a translation file (see config.mjs).
const all = Object.fromEntries(
  await Promise.all(languages.map(async (l) => [l, (await import(`./i18n/${l}.mjs`)).default])),
);
const { fr, en } = all;
const renderers = {
  home: homePage, tours: toursPage, about: aboutPage, gallery: galleryPage, practical: practicalPage, contact: contactPage,
  group: (t) => landingPage(t, "group"), corporate: (t) => landingPage(t, "corporate"),
  seniors: (t) => landingPage(t, "seniors"), thematic: (t) => landingPage(t, "thematic"),
  voltaire: voltairePage, prices: pricesPage,
};

checkTranslations();

// Photos without a title and legend still appear (titled from their file
// name), but say so, so captions are never forgotten.
const uncaptioned = photos.filter((p) => !details[p.file]).map((p) => p.file);
if (uncaptioned.length) console.warn(`Gallery photos without a title/legend in src/gallery.mjs: ${uncaptioned.join(", ")}`);

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
await cp(join(here, "assets", "favicon.ico"), join(out, "favicon.ico"));
if (site.indexNowKey) await write(`${site.indexNowKey}.txt`, site.indexNowKey);

// llms.txt: a plain summary with the key pages, for AI search assistants.
const llmsPages = ["home", "tours", "prices", "group", "corporate", "seniors", "thematic", "voltaire", "about", "gallery", "practical", "contact"];
await write("llms.txt", `# ${site.brand}

> ${en.meta.home.description}

Sylvie is an accredited guide at the Château de Voltaire in Ferney-Voltaire (France), working with the château for more than 8 years. Tours in French, English, German and Russian; every visit includes Voltaire's gardens. 15 minutes from Geneva Airport and Palexpo, TPG bus lines 60/61, coach parking on site. Prices cover the guiding fee only; the château admission is paid on site.

## English
${llmsPages.map((p) => `- [${en.meta[p].title}](${site.origin}${pathFor("en", p)}): ${en.meta[p].description}`).join("\n")}

## Français
${llmsPages.map((p) => `- [${fr.meta[p].title}](${site.origin}${pathFor("fr", p)}): ${fr.meta[p].description}`).join("\n")}

## Other languages
${languages.filter((l) => !["en", "fr"].includes(l)).map((l) => `- [${langMeta[l].name}](${site.origin}${pathFor(l, "home")})`).join("\n")}
`);
await write("site.webmanifest", JSON.stringify({
  name: "Sylvie · Château de Voltaire", short_name: "Sylvie", start_url: "/", display: "browser",
  background_color: "#ffffff", theme_color: "#111111",
  icons: [{ src: "/assets/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png" }],
}));

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
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
${imageEntries(lang, page)}${videoEntry(lang, page)}  </url>`,
    ),
  )
  .join("\n")}
</urlset>
`;
await write("sitemap.xml", sitemap);

// Videos, listed on the page that shows them (in every language).
function videoEntry(lang, page) {
  const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return Object.values(VIDEOS)
    .filter((v) => v.page === page)
    .map((v) => {
      const text = all[lang].common[v.text];
      return `    <video:video>
      <video:thumbnail_loc>${site.origin}${v.poster}</video:thumbnail_loc>
      <video:title>${xml(text.caption)}</video:title>
      <video:description>${xml(text.description)}</video:description>
      <video:content_loc>${site.origin}${v.src}</video:content_loc>
      <video:duration>${v.seconds}</video:duration>
    </video:video>\n`;
    })
    .join("");
}

// Gallery photos are listed in the image sitemap for the gallery page and the
// home page (whose filmstrip shows them all), so they can rank in image search.
function imageEntries(lang, page) {
  if (page !== "gallery" && page !== "home") return "";
  const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return galleryImages(all[lang])
    .map((img) => `    <image:image><image:loc>${xml(img.contentUrl)}</image:loc></image:image>\n`)
    .join("");
}
// GitHub Pages reads the custom domain from this file.
await write("CNAME", new URL(site.origin).host + "\n");
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
