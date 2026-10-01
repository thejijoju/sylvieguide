// SEO audit of the built site (dist/). Run after `npm run build`:
//   npm run seo
// Fails (exit code 1) on errors; prints warnings for things to improve.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { site, languages } from "./config.mjs";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const errors = [];
const warnings = [];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const pages = walk(dist).filter((f) => f.endsWith("index.html") && relative(dist, f).includes("/"));
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];

// What each language should be found for (checked in title + h1 + body text).
const keywords = {
  fr: ["visite guidée", "château de voltaire", "ferney-voltaire", "guide"],
  en: ["voltaire castle", "private guide", "ferney-voltaire", "group"],
  de: ["führungen", "schloss voltaire", "ferney-voltaire"],
  ru: ["экскурси", "вольтер", "ферне"],
};

const titles = new Map();
const descriptions = new Map();
const urlOf = (file) => site.origin + "/" + relative(dist, dirname(file)).split("\\").join("/") + "/";

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const where = relative(dist, file);
  const lang = (html.match(/<html lang="([a-z]+)"/) || [])[1];
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];

  if (!lang) errors.push(`${where}: missing <html lang>`);
  if (!title) errors.push(`${where}: missing <title>`);
  else if (title.length > 65) warnings.push(`${where}: title is ${title.length} chars (keep ≤ 65 so it is not cut in results): "${title}"`);
  if (!desc) errors.push(`${where}: missing meta description`);
  else if (desc.length < 110 || desc.length > 165) warnings.push(`${where}: description is ${desc.length} chars (aim for 110–165)`);
  if (titles.has(title)) errors.push(`${where}: duplicate title with ${titles.get(title)}`);
  titles.set(title, where);
  if (descriptions.has(desc)) errors.push(`${where}: duplicate description with ${descriptions.get(desc)}`);
  descriptions.set(desc, where);
  if (canonical !== urlOf(file)) errors.push(`${where}: canonical ${canonical} should be ${urlOf(file)}`);

  // hreflang: every language + x-default, each alternate page must exist
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
  const got = new Set(alts.map((m) => m[1]));
  for (const l of [...languages, "x-default"]) if (!got.has(l)) errors.push(`${where}: missing hreflang ${l}`);
  for (const [, , href] of alts) {
    const path = href.replace(site.origin, "");
    if (!existsSync(join(dist, path, "index.html")) && path !== "/") errors.push(`${where}: hreflang target ${path} does not exist`);
  }

  // Open Graph
  for (const p of ["og:title", "og:description", "og:image", "og:url", "og:locale"]) {
    if (!html.includes(`property="${p}"`)) errors.push(`${where}: missing ${p}`);
  }
  const ogImage = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || "";
  if (ogImage && !existsSync(join(dist, ogImage.replace(site.origin, "")))) errors.push(`${where}: og:image file missing (${ogImage})`);

  // Headings
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) errors.push(`${where}: ${h1s.length} <h1> (want exactly 1)`);

  // Images: alt text, dimensions, file exists
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    const src = attr(tag, "src");
    const alt = attr(tag, "alt");
    if (alt === undefined) errors.push(`${where}: <img src="${src}"> has no alt attribute`);
    if (src && !tag.includes('alt=""') && !(attr(tag, "width") && attr(tag, "height"))) warnings.push(`${where}: <img src="${src}"> has no width/height`);
    if (src && src.startsWith("/") && !existsSync(join(dist, decodeURIComponent(src.split("?")[0])))) errors.push(`${where}: image ${src} not found`);
  }

  // Internal links resolve
  for (const [, href] of html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)/g)) {
    const target = href.endsWith("/") ? join(dist, href, "index.html") : join(dist, decodeURIComponent(href));
    if (!existsSync(target)) errors.push(`${where}: broken internal link ${href}`);
  }

  // Structured data parses
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); } catch (e) { errors.push(`${where}: invalid JSON-LD (${e.message})`); }
  }

  // Keywords
  const text = decode(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ")).toLowerCase();
  for (const k of keywords[lang] || []) {
    if (where.split("/").length === 2 && !text.includes(k)) warnings.push(`${where}: home page never mentions "${k}"`);
  }
}

// Sitemap covers every page
const sitemap = readFileSync(join(dist, "sitemap.xml"), "utf8");
for (const file of pages) if (!sitemap.includes(`<loc>${urlOf(file)}</loc>`)) errors.push(`sitemap.xml: missing ${urlOf(file)}`);
if (!readFileSync(join(dist, "robots.txt"), "utf8").includes("Sitemap:")) errors.push("robots.txt: no Sitemap line");
if (/sylvie-guide-voltaire\.com/.test(site.origin)) warnings.push(`config: origin is still the placeholder ${site.origin}; set the real domain before launch`);

for (const w of warnings) console.log("warn  " + w);
for (const e of errors) console.log("ERROR " + e);
console.log(`\n${pages.length} pages checked: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
