// Renders the 1200×630 OpenGraph images (one per language) and the
// apple-touch-icon into src/assets with a headless Chromium.
// Needs Playwright: `npx playwright install chromium` once, or set
// CHROMIUM_PATH to an existing Chromium/Chrome binary.

import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { languages } from "./config.mjs";
import { chateauSvg, favicon } from "./art.mjs";
import { FONTS_URL } from "./templates.mjs";
import fr from "./i18n/fr.mjs";
import en from "./i18n/en.mjs";
import de from "./i18n/de.mjs";
import ru from "./i18n/ru.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const all = { fr, en, de, ru };
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

for (const lang of languages) {
  const t = all[lang];
  await page.setContent(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS_URL}"><style>${css}
body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #1f2a44; }
.og { display: grid; grid-template-columns: 560px 1fr; height: 630px; }
.og-text { padding: 64px 0 56px 64px; color: #f4ecdb; display: flex; flex-direction: column; }
.og-text .brand-mark { width: 64px; height: 64px; font-size: 2.3rem; margin-bottom: 36px; box-shadow: inset 0 0 0 2px #b8955a; }
.og-text .eyebrow { color: #b8955a; font-size: 17px; margin-bottom: 18px; }
.og-text h1 { color: #fffdf8; font-size: 56px; line-height: 1.05; margin: 0 0 22px; }
.og-text p { font-size: 25px; line-height: 1.35; color: #e6dcc6; margin: 0; }
.og-langs { margin-top: auto !important; font-size: 20px !important; color: #b8955a !important; letter-spacing: .06em; }
.og-art { padding: 48px 48px 48px 24px; display: grid; align-items: center; }
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
