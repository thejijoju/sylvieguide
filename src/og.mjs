// Renders the 1200×630 OpenGraph images (one per language) into
// src/assets/og with a headless Chromium: the château photo, the round
// marble Voltaire logo and the home page headline.
// Needs Playwright: `npx playwright install chromium` once, or set
// CHROMIUM_PATH to an existing Chromium/Chrome binary.

import { mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { languages, langMeta } from "./config.mjs";
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

const dataUri = (file, mime) => `data:${mime};base64,${readFileSync(join(here, "assets", file)).toString("base64")}`;
const photo = dataUri("img/hero-chateau-de-voltaire-ferney.jpg", "image/jpeg");
const bust = dataUri("img/voltaire-buste-marbre.jpg", "image/jpeg");

// Chinese, Japanese, Korean and Hindi need fonts this machine may not have;
// those languages share the English card unless OG_ALL=1 is set.
const skip = process.env.OG_ALL ? [] : ["zh", "ja", "ko", "hi"];
for (const lang of languages.filter((l) => !skip.includes(l))) {
  const t = all[lang];
  const rtl = langMeta[lang].dir === "rtl";
  await page.setContent(`<!doctype html><html lang="${lang}" dir="${langMeta[lang].dir || "ltr"}"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS_URL}"><style>${css}
body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #0d0d0e; }
.og { position: relative; width: 1200px; height: 630px; }
.og-photo { position: absolute; inset-block: 0; inset-inline-end: 0; width: 760px; height: 100%; object-fit: cover; object-position: 50% 55%; }
.og::after { content: ""; position: absolute; inset: 0; background: linear-gradient(${rtl ? 270 : 90}deg, #0d0d0e 0%, #0d0d0e 38%, rgba(13,13,14,.6) 46%, rgba(13,13,14,0) 58%); }
.og-text { position: absolute; z-index: 1; inset-block: 0; inset-inline-start: 0; width: 640px; padding: 56px 64px; color: #f4ecdb; display: flex; flex-direction: column; box-sizing: border-box; }
.og-logo { display: flex; align-items: center; gap: 16px; margin-bottom: 34px; font-family: var(--font-display); font-size: 28px; font-weight: 700; color: #fff; }
.og-logo img { width: 68px; height: 68px; border-radius: 50%; box-shadow: 0 0 0 3px #b8955a; }
.og-text .eyebrow { color: #e3c891; font-size: 17px; margin-bottom: 16px; }
.og-text h1 { color: #fffdf8; font-size: 50px; line-height: 1.08; margin: 0 0 22px; }
.og-text p { font-size: 24px; line-height: 1.35; color: #e6dcc6; margin: 0; }
.og-langs { margin-top: auto !important; font-size: 20px !important; color: #e3c891 !important; letter-spacing: .06em; }
</style></head><body><div class="og">
  <img class="og-photo" src="${photo}" alt="">
  <div class="og-text">
    <p class="og-logo"><img src="${bust}" alt="">Sylvie</p>
    <p class="eyebrow">Ferney-Voltaire · Genève</p>
    <h1>${t.home.h1}</h1>
    <p>${t.cta.book} · ${t.cta.quote}</p>
    <p class="og-langs">FR · EN · DE · RU</p>
  </div>
</div></body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(here, "assets", "og", `og-${lang}.jpg`), type: "jpeg", quality: 84 });
  console.log(`og-${lang}.jpg`);
}

await browser.close();
