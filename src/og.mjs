// Renders the 1200×630 OpenGraph images (one per language) and the
// apple-touch-icon into src/assets with a headless Chromium.
// Needs Playwright: `npx playwright install chromium` once, or set
// CHROMIUM_PATH to an existing Chromium/Chrome binary.

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { languages, langMeta } from "./config.mjs";
import { chateauSvg, favicon } from "./art.mjs";
import { FONTS_URL } from "./templates.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// Every language that has a translation file (see config.mjs).
const all = Object.fromEntries(
  await Promise.all(languages.map(async (l) => [l, (await import(`./i18n/${l}.mjs`)).default])),
);
const { fr, en } = all;
const css = (await import("node:fs")).readFileSync(join(here, "assets", "styles.css"), "utf8");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = createRequire(import.meta.url)("playwright"));
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await mkdir(join(here, "assets", "og"), { recursive: true });

// Chinese, Japanese, Korean and Hindi need fonts this machine may not have;
// those languages share the English card unless OG_ALL=1 is set.
const skip = process.env.OG_ALL ? [] : ["zh", "ja", "ko", "hi"];
for (const lang of languages.filter((l) => !skip.includes(l))) {
  const t = all[lang];
  await page.setContent(`<!doctype html><html lang="${lang}" dir="${langMeta[lang].dir || "ltr"}"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS_URL}"><style>${css}
body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #1f2a44; }
.og { display: grid; grid-template-columns: 560px 1fr; height: 630px; }
.og-text { padding-block: 64px 56px; padding-inline: 64px 0; color: #f4ecdb; display: flex; flex-direction: column; }
.og-text .brand-mark { width: 64px; height: 64px; font-size: 2.3rem; margin-bottom: 36px; box-shadow: inset 0 0 0 2px #b8955a; }
.og-text .eyebrow { color: #b8955a; font-size: 17px; margin-bottom: 18px; }
.og-text h1 { color: #fffdf8; font-size: 56px; line-height: 1.05; margin: 0 0 22px; }
.og-text p { font-size: 25px; line-height: 1.35; color: #e6dcc6; margin: 0; }
.og-langs { margin-top: auto !important; font-size: 20px !important; color: #b8955a !important; letter-spacing: .06em; }
.og-art { padding-block: 48px; padding-inline: 24px 48px; display: grid; align-items: center; }
.og-art .chateau { border: 1px solid #b8955a; box-shadow: 0 0 0 10px rgba(184,149,90,.12); }
</style></head><body><div class="og">
  <div class="og-text">
    <span class="brand-mark">S</span>
    <p class="eyebrow">Ferney-Voltaire · Genève</p>
    <h1>${t.home.h1}</h1>
    <p>${t.cta.book} · ${t.cta.quote}</p>
    <p class="og-langs">FR · EN · DE · RU</p>
  </div>
  <div class="og-art">${chateauSvg({ title: t.ogImageAlt })}</div>
</div></body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(here, "assets", "og", `og-${lang}.png`) });
  console.log(`og-${lang}.png`);
}

await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(`<html><body style="margin:0">${favicon.replace("<svg ", '<svg width="180" height="180" ')}</body></html>`);
await page.screenshot({ path: join(here, "assets", "apple-touch-icon.png"), omitBackground: true });
console.log("apple-touch-icon.png");

await browser.close();
