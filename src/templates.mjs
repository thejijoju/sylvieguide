import { site, languages, langMeta, pages, parents, headerPages, tourLanguages, slugs, tourCategories, groupTypes, packages } from "./config.mjs";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chateauSvg, ornament, icon } from "./art.mjs";
import { photos } from "./gallery.mjs";

// ---------------------------------------------------------------- helpers

export const pathFor = (lang, page) => {
  const slug = slugs[lang][page];
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
};
export const urlFor = (lang, page) => site.origin + pathFor(lang, page);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripTags = (s) => String(s).replace(/<[^>]+>/g, "");
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

// Typographic conventions differ: « » with spaces in French, „ “ in German…
const QUOTES = {
  fr: ["« ", " »"], en: ["“", "”"], de: ["„", "“"], ru: ["«", "»"], es: ["«", "»"], it: ["«", "»"],
  pt: ["«", "»"], nl: ["“", "”"], pl: ["„", "”"], uk: ["«", "»"], zh: ["“", "”"], ja: ["「", "」"],
  ko: ["“", "”"], ar: ["«", "»"], hi: ["“", "”"], tr: ["“", "”"],
};
const quoteMarks = (t) => QUOTES[t.lang] || QUOTES.en;
const quoted = (t, s) => `${quoteMarks(t)[0]}${esc(s)}${quoteMarks(t)[1]}`;
const colon = (t) => (t.lang === "fr" ? "\u00a0:" : ":");

const ASSET_VERSION = Date.now().toString(36);

// Default group type and form preset for each tour, used by "Book this tour".
const tourGroupType = {
  classic: "individual", private: "individual", discovery: "tourist", town: "tourist",
  enlightenment: "private", "chateau-life": "private", gardens: "private",
  corporate: "corporate", seniors: "seniors", schools: "school",
};

// Where each home-page audience card leads.
const audienceHref = (t, key) =>
  ({
    individual: `${pathFor(t.lang, "tours")}#cat-individual`,
    groups: pathFor(t.lang, "group"),
    corporate: pathFor(t.lang, "corporate"),
    seniors: pathFor(t.lang, "seniors"),
    schools: `${pathFor(t.lang, "tours")}#schools`,
  })[key];
const audienceIcon = { individual: "key", groups: "users", corporate: "handshake", seniors: "bench", schools: "pupil" };

const fmtDuration = (t, min) => {
  if (min < 60) return `${min} ${t.common.minutes}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hour = { fr: "h", en: "h", de: "Std.", ru: "ч", es: "h", it: "h", pt: "h", nl: "u", pl: "godz.", uk: "год", zh: "小时", ja: "時間", ko: "시간", ar: "س", hi: "घंटा", tr: "sa" }[t.lang] || "h";
  if (!m) return `${h} ${hour}`;
  // FR/EN/DE/RU write "1 h 15"; other languages spell out the minutes.
  return ["fr", "en", "de", "ru"].includes(t.lang) ? `${h} ${hour} ${m}` : `${h} ${hour} ${m} ${t.common.minutes}`;
};

// ---------------------------------------------------------------- layout

function head(t, page, { title, description }, og = null) {
  const canonical = urlFor(t.lang, page);
  const ogImage = og?.url || `${site.origin}/assets/og/og-${ogLang(t.lang)}.jpg`;
  const alternates = languages
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${urlFor(l, page)}">`)
    .join("\n  ");
  const xDefault = page === "home" ? `${site.origin}/` : urlFor("en", page);
  const otherLocales = languages
    .filter((l) => l !== t.lang)
    .map((l) => `<meta property="og:locale:alternate" content="${langMeta[l].locale}">`)
    .join("\n  ");

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${xDefault}">
  <meta name="theme-color" content="#111111">
  ${site.verification.google ? `<meta name="google-site-verification" content="${esc(site.verification.google)}">` : ""}
  ${site.verification.bing ? `<meta name="msvalidate.01" content="${esc(site.verification.bing)}">` : ""}
  ${site.verification.yandex ? `<meta name="yandex-verification" content="${esc(site.verification.yandex)}">` : ""}
  <meta name="geo.region" content="FR-01">
  <meta name="geo.placename" content="Ferney-Voltaire">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(site.brand)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  ${og?.width || !og ? `<meta property="og:image:width" content="${og?.width || 1200}">
  <meta property="og:image:height" content="${og?.height || 630}">` : ""}
  <meta property="og:image:alt" content="${esc(og?.alt || t.home.daytrip.imgAlt)}">
  <meta property="og:locale" content="${t.locale}">
  ${otherLocales}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ogImage}">

  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  ${page === "home" ? `<link rel="preload" as="image" href="/assets/img/hero-chateau-de-voltaire-ferney-800.webp" imagesrcset="/assets/img/hero-chateau-de-voltaire-ferney-800.webp 800w, /assets/img/hero-chateau-de-voltaire-ferney.webp 1470w" imagesizes="100vw" fetchpriority="high">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${fontsUrl(t.lang)}">
  <link rel="stylesheet" href="/assets/styles.css?v=${ASSET_VERSION}">
  ${languageScript(t, page)}
  <script src="/assets/main.js?v=${ASSET_VERSION}" defer></script>
</head>`;
}

const BASE_FONTS = "family=Montserrat:wght@500;600;700&family=Inter:ital,wght@0,400;0,500;0,600;1,400";
export const fontsUrl = (lang) =>
  `https://fonts.googleapis.com/css2?${BASE_FONTS}${langMeta[lang]?.font ? `&family=${langMeta[lang].font}` : ""}&display=swap`;
export const FONTS_URL = fontsUrl("en");

const here = dirname(fileURLToPath(import.meta.url));
// Languages without their own social card share the English one.
const ogLang = (lang) => (existsSync(join(here, "assets", "og", `og-${lang}.jpg`)) ? lang : "en");
const flagImg = (l, size = 20) =>
  `<img class="flag" src="/assets/flags/${langMeta[l].flag}.svg" alt="" width="${size}" height="${Math.round(size * 0.75)}" loading="lazy" decoding="async">`;

// Header: a flag dropdown (works without JavaScript thanks to <details>).
// Footer: every language listed with its flag.
function langSwitcher(t, page, extraClass = "") {
  const items = languages
    .map((l) => `<li><a href="${pathFor(l, page)}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === t.lang ? ' aria-current="true"' : ""}>${flagImg(l)}<span>${esc(langMeta[l].name)}</span></a></li>`)
    .join("");
  if (extraClass === "lang-switch-footer") {
    return `<nav class="lang-switch lang-switch-footer" aria-label="${esc(t.nav.langLabel)}"><ul>${items}</ul></nav>`;
  }
  return `<details class="lang-menu" data-lang-menu>
      <summary aria-label="${esc(t.nav.langLabel)}: ${esc(langMeta[t.lang].name)}">${flagImg(t.lang, 22).replace(' loading="lazy"', "")}<span class="lang-code">${t.lang.toUpperCase()}</span><svg class="icon lang-caret" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg></summary>
      <nav aria-label="${esc(t.nav.langLabel)}"><ul class="lang-list">${items}</ul></nav>
    </details>`;
}

// Runs before the page paints. First visit, no saved choice: switch to the
// browser's language when that version exists. A choice made in the menu is
// saved and always wins. Crawlers are never redirected, so every language
// version stays indexable.
function languageScript(t, page) {
  const alternates = Object.fromEntries(languages.map((l) => [l, pathFor(l, page)]));
  // nav-compact: the header menu is collapsed whenever its labels do not fit
  // (widths vary a lot between languages). main.js measures it; the width it
  // saved last time avoids a flash of the wide menu on the next page.
  return `<script>(function(){try{var w=+localStorage.getItem("navw-${t.lang}");if(w&&innerWidth<w)document.documentElement.classList.add("nav-compact")}catch(e){}})();
(function(){try{var a=${JSON.stringify(alternates)},cur=${JSON.stringify(t.lang)},s=null;try{s=localStorage.getItem("lang")}catch(e){}
if(/bot|crawl|spider|slurp|lighthouse|inspection|preview|facebookexternalhit|embedly|whatsapp|telegram|headless/i.test(navigator.userAgent)||/[?&]lang=keep/.test(location.search))return;
if(s){if(s!==cur&&a[s])location.replace(a[s]+location.search+location.hash);return}
var p=navigator.languages||[navigator.language||""];for(var i=0;i<p.length;i++){var c=String(p[i]).slice(0,2).toLowerCase();if(a[c]){if(c!==cur)location.replace(a[c]+location.search+location.hash);return}}}catch(e){}})();</script>`;
}

function header(t, page) {
  const links = headerPages
    .map(
      (p) =>
        `<li><a href="${pathFor(t.lang, p)}"${p === page ? ' aria-current="page"' : ""}>${esc(t.nav[p])}</a></li>`,
    )
    .join("");
  return `<a class="skip-link" href="#main">${esc(t.nav.skip)}</a>
<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="${pathFor(t.lang, "home")}" aria-label="${esc(site.brand)}">
      <img class="brand-mark" src="/assets/img/voltaire-buste-marbre.jpg" alt="" width="50" height="50" decoding="async">
      <span class="brand-text"><span class="brand-name">${esc(site.guideName)}</span><span class="brand-sub">Château de Voltaire</span></span>
    </a>
    <nav class="main-nav" id="main-nav" aria-label="${esc(t.nav.menu)}" data-nav>
      <ul>${links}<li class="nav-contact"><a href="${pathFor(t.lang, "contact")}"${page === "contact" ? ' aria-current="page"' : ""}>${esc(t.nav.contact)}</a></li></ul>
      <a class="btn btn-primary btn-sm nav-cta" href="${pathFor(t.lang, "contact")}?type=individual#booking">${esc(t.cta.book)}</a>
    </nav>
    ${langSwitcher(t, page)}
    <button class="nav-toggle" type="button" aria-controls="main-nav" aria-expanded="false" data-nav-toggle data-label-open="${esc(t.nav.menu)}" data-label-close="${esc(t.nav.close)}">
      ${icon("menu", "icon icon-open")}${icon("close", "icon icon-close")}<span class="sr-only">${esc(t.nav.menu)}</span>
    </button>
  </div>
</header>`;
}

function footer(t, page) {
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <p class="footer-logo"><img class="brand-mark" src="/assets/img/voltaire-buste-marbre.jpg" alt="" width="50" height="50" decoding="async"> ${esc(site.guideName)}</p>
      <p>${esc(t.footer.tagline)}</p>
      <p class="footer-langs">${esc(t.common.languagesSpoken)}</p>
      <figure class="footer-photo">
        <img src="/assets/img/chateau-de-voltaire-facade.jpg" alt="${esc(t.footer.photoAlt)}" width="640" height="480" loading="lazy" decoding="async">
        <figcaption>Château de Voltaire · Ferney-Voltaire</figcaption>
      </figure>
    </div>
    <nav aria-label="${esc(t.footer.explore)}">
      <h2 class="footer-title">${esc(t.footer.explore)}</h2>
      <ul>${pages.map((p) => `<li><a href="${pathFor(t.lang, p)}">${esc(t.nav[p])}</a></li>`).join("")}</ul>
    </nav>
    <div>
      <h2 class="footer-title">${esc(t.footer.contact)}</h2>
      <ul class="footer-contact">
        <li>${icon("mail")}<a href="${pathFor(t.lang, "contact")}#booking">${esc(t.contact.formTitle)}</a></li>
        <li>${icon("pin")}<span>${esc(site.address.name)}<br>${esc(site.address.street)}, ${site.address.postalCode} ${esc(site.address.locality)}</span></li>
      </ul>
    </div>
    <div>
      <h2 class="footer-title">${esc(t.footer.languages)}</h2>
      ${langSwitcher(t, page, "lang-switch-footer")}
    </div>
  </div>
  <div class="container footer-bottom">
    <p>© ${year} ${esc(site.guideName)} — ${esc(t.footer.rights)}</p>
    <p class="footer-note">${esc(t.footer.note)}</p>
  </div>
</footer>`;
}

function crumbTrail(t, page) {
  const trail = [{ name: t.common.breadcrumbHome, page: "home" }];
  if (parents[page]) trail.push({ name: t.nav[parents[page]], page: parents[page] });
  trail.push({ name: t.nav[page], page });
  return trail;
}

function breadcrumbs(t, page) {
  const trail = crumbTrail(t, page);
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>${trail
        .map((c, i) => (i < trail.length - 1 ? `<li><a href="${pathFor(t.lang, c.page)}">${esc(c.name)}</a></li>` : `<li aria-current="page">${esc(c.name)}</li>`))
        .join("")}</ol>
    </nav>`;
}

function breadcrumbLd(t, page) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${urlFor(t.lang, page)}#breadcrumb`,
    itemListElement: crumbTrail(t, page).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: urlFor(t.lang, c.page) })),
  };
}

// Entities shared by every page: the guide, her business and the château.
function baseGraph(t, page) {
  const addr = {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: site.address.postalCode,
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  };
  return [
    {
      "@type": "WebSite",
      "@id": `${site.origin}/#website`,
      url: `${site.origin}/`,
      name: site.brand,
      inLanguage: languages,
      publisher: { "@id": `${site.origin}/#business` },
    },
    {
      "@type": "Person",
      "@id": `${site.origin}/#sylvie`,
      name: site.guideName,
      jobTitle: stripTags(t.home.eyebrow.split("·")[0].trim()),
      knowsLanguage: ["fr", "en", "de", "ru"],
      worksFor: { "@id": `${site.origin}/#business` },
      knowsAbout: ["Voltaire", "Château de Voltaire", "Enlightenment"],
      image: site.origin + SYLVIE_PHOTO,
      ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
      url: urlFor(t.lang, "about"),
    },
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": `${site.origin}/#business`,
      name: site.brand,
      description: t.meta.home.description,
      url: urlFor(t.lang, "home"),
      ...(site.email ? { email: site.email } : {}),
      ...(site.phone ? { telephone: site.phone } : {}),
      image: [HERO_PHOTO, SYLVIE_PHOTO, `/assets/og/og-${ogLang(t.lang)}.jpg`].map((u) => site.origin + u),
      address: addr,
      hasMap: MAP_URL,
      areaServed: ["Ferney-Voltaire", "Pays de Gex", "Genève", "Geneva"],
      founder: { "@id": `${site.origin}/#sylvie` },
      employee: { "@id": `${site.origin}/#sylvie` },
      logo: `${site.origin}/assets/icon-512.png`,
      priceRange: `${money(t, Math.min(...packages.flatMap((pk) => pk.lines.map((l) => l.amount)).filter((a) => a > 0)))}–${money(t, Math.max(...packages.flatMap((pk) => pk.lines.map((l) => l.amount))))}`,
      currenciesAccepted: site.currency || "EUR",
      hasOfferCatalog: { "@id": `${urlFor(t.lang, "prices")}#packages` },
      knowsAbout: ["Voltaire", "Château de Voltaire", "Ferney-Voltaire", "Enlightenment", "18th-century history"],
      ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
      availableLanguage: ["French", "English", "German", "Russian"],
    },
    {
      "@type": ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
      "@id": `${site.origin}/#chateau`,
      name: "Château de Voltaire",
      description: stripTags(t.voltaire.chateau[0]),
      image: site.origin + HERO_PHOTO,
      address: addr,
      hasMap: MAP_URL,
      publicAccess: true,
      isAccessibleForFree: false,
      touristType: ["Cultural tourism", "Heritage tourism", "Literary tourism"],
      openingHoursSpecification: chateauHoursLd(),
      sameAs: ["https://www.chateau-ferney-voltaire.fr/", "https://fr.wikipedia.org/wiki/Ch%C3%A2teau_de_Voltaire"],
    },
    {
      "@type": "WebPage",
      "@id": `${urlFor(t.lang, page)}#webpage`,
      url: urlFor(t.lang, page),
      name: t.meta[page].title,
      description: t.meta[page].description,
      inLanguage: t.lang,
      isPartOf: { "@id": `${site.origin}/#website` },
      about: { "@id": `${site.origin}/#chateau` },
      ...(page !== "home" ? { breadcrumb: { "@id": `${urlFor(t.lang, page)}#breadcrumb` } } : {}),
    },
    ...(page !== "home" ? [breadcrumbLd(t, page)] : []),
  ];
}

function ctaBand(t, title, text) {
  return `<section class="cta-band" aria-labelledby="cta-title">
    <div class="container cta-inner">
      ${ornament}
      <h2 id="cta-title">${esc(title)}</h2>
      <p>${esc(text)}</p>
      <div class="btn-row btn-row-center">
        <a class="btn btn-gold" href="${pathFor(t.lang, "contact")}?type=individual#booking">${esc(t.cta.book)}</a>
        <a class="btn btn-ghost-light" href="${pathFor(t.lang, "contact")}?type=tourist#booking">${esc(t.cta.quote)}</a>
      </div>
    </div>
  </section>`;
}

function pageHero(t, page, h1, lead) {
  return `<section class="page-hero">
    <div class="container">
      ${breadcrumbs(t, page)}
      <h1>${esc(h1)}</h1>
      ${ornament}
      <p class="lead">${esc(lead)}</p>
      ${GARDEN_PAGES.includes(page) ? `<p class="hero-badge">${icon("leaf")}${esc(t.common.gardensIncluded)}</p>` : ""}
    </div>
  </section>`;
}
// Pages that remind visitors the gardens are part of every tour.
const GARDEN_PAGES = ["tours", "group", "corporate", "seniors", "thematic", "practical"];

export function layout(t, page, body, extraLd = [], { og = null } = {}) {
  const meta = t.meta[page];
  return `<!doctype html>
<html lang="${t.lang}" dir="${langMeta[t.lang].dir || "ltr"}">
${head(t, page, meta, og)}
<body class="page-${page}">
${header(t, page)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(t, page)}
${jsonLd({ "@context": "https://schema.org", "@graph": [...baseGraph(t, page), ...extraLd] })}
</body>
</html>
`;
}

// ---------------------------------------------------------------- pages

// Tour categories and tours that have their own landing page.
const categoryLanding = { groups: "group", thematic: "thematic", special: "group" };
const tourLanding = { corporate: "corporate", seniors: "seniors", enlightenment: "thematic", "chateau-life": "thematic", gardens: "thematic", discovery: "group", town: "group" };

const tourById = Object.fromEntries(
  tourCategories.flatMap((c) => c.tours.map((tour) => [tour.id, { ...tour, category: c.id }])),
);

function tourCard(t, tour, { compact = false } = {}) {
  const item = t.tours.items[tour.id];
  const contact = pathFor(t.lang, "contact");
  const bookHref = `${contact}?type=${tourGroupType[tour.id]}&tour=${encodeURIComponent(tour.id)}#booking`;
  const meta = `<dl class="tour-meta">
        <div>${icon("clock")}<dt>${esc(t.tours.labels.duration)}</dt><dd>${fmtDuration(t, tour.duration)}</dd></div>
        <div>${icon("users")}<dt>${esc(t.tours.labels.size)}</dt><dd>${tour.size[0]}–${tour.size[1]} ${esc(t.common.people)}</dd></div>
      </dl>`;
  if (compact) {
    return `<article class="card theme-card">
      <div class="card-icon">${icon(tour.icon)}</div>
      <h3><a href="${pathFor(t.lang, "tours")}#${tour.id}">${esc(item.title)}</a></h3>
      <p>${esc(item.summary)}</p>
      ${meta}
    </article>`;
  }
  return `<article class="card tour-card" id="${tour.id}">
      <div class="tour-head">
        <div class="card-icon">${icon(tour.icon)}</div>
        <h3>${esc(item.title)}</h3>
      </div>
      <p>${esc(item.summary)}</p>
      <ul class="checklist">${item.highlights.map((h) => `<li>${icon("check")}${esc(h)}</li>`).join("")}</ul>
      ${meta}
      <p class="ideal"><strong>${esc(t.tours.labels.idealFor)}${colon(t)}</strong> ${esc(item.idealFor)}</p>
      ${tourLanding[tour.id] ? `<p class="more-link"><a class="text-link" href="${pathFor(t.lang, tourLanding[tour.id])}">${esc(t.common.more)} ${icon("arrow")}</a></p>` : ""}
      <a class="btn btn-outline btn-sm" href="${bookHref}">${esc(
        ["individual"].includes(tourGroupType[tour.id]) ? t.tours.labels.book : t.tours.labels.quote,
      )} ${icon("arrow")}</a>
    </article>`;
}

// Welcome video of Sylvie: silent, looping, starts by itself unless the
// visitor prefers reduced motion; a button pauses and resumes it.
// Silent looping videos of Sylvie. Each plays only while on screen (and not
// at all for visitors who prefer reduced motion); a button pauses it.
// `text` names the caption/description block in t.common.
export const VIDEOS = {
  welcome: { page: "home", text: "video", src: "/assets/video/sylvie-accueil.mp4", webm: "/assets/video/sylvie-accueil.webm", poster: "/assets/video/sylvie-accueil-poster.jpg", seconds: 10, width: 720, height: 1280, preload: "metadata" },
  park: { page: "about", text: "video2", src: "/assets/video/sylvie-parc.mp4", webm: "/assets/video/sylvie-parc.webm", poster: "/assets/video/sylvie-parc-poster.jpg", seconds: 23, width: 720, height: 1280, preload: "none" },
};
// Château opening hours (Centre des monuments nationaux): every day,
// 10:00–18:00 from 1 April to 30 September, 10:00–17:00 the rest of the year.
const CHATEAU_HOURS = [
  { from: "04-01", to: "09-30", opens: "10:00", closes: "18:00" },
  { from: "10-01", to: "03-31", opens: "10:00", closes: "17:00" },
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function chateauHoursLd() {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1].flatMap((year) =>
    CHATEAU_HOURS.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAYS,
      opens: h.opens,
      closes: h.closes,
      validFrom: `${year}-${h.from}`,
      validThrough: `${h.to < h.from ? year + 1 : year}-${h.to}`,
    })),
  ).filter((h) => h.validThrough >= new Date().toISOString().slice(0, 10));
}
const HERO_PHOTO = "/assets/img/hero-chateau-de-voltaire-ferney.jpg";
const MAP_URL = `https://www.openstreetmap.org/search?query=${encodeURIComponent("Château de Voltaire, Ferney-Voltaire")}`;
const SYLVIE_PHOTO = "/assets/img/sylvie-guide-chateau-de-voltaire.jpg";

function videoFigure(t, key) {
  const v = VIDEOS[key];
  const text = t.common[v.text];
  const labels = t.common.video;
  return `<figure class="portrait welcome-video" data-video>
      <div class="video-frame">
      <video poster="${v.poster}" width="${v.width}" height="${v.height}" muted loop playsinline preload="${v.preload}" aria-label="${esc(text.caption)}" data-autoplay>
        <source src="${v.webm}" type="video/webm">
        <source src="${v.src}" type="video/mp4">
      </video>
      <button type="button" class="video-toggle" data-video-toggle data-label-pause="${esc(labels.pause)}" data-label-play="${esc(labels.play)}" aria-label="${esc(labels.play)}" hidden>
        <svg class="icon icon-pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5v14M16 5v14"/></svg>
        <svg class="icon icon-play" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l12-7.5z"/></svg>
      </button>
      </div>
      <figcaption>${esc(text.caption)}</figcaption>
    </figure>`;
}

export function videoLd(t, key) {
  const v = VIDEOS[key];
  return {
    "@type": "VideoObject",
    "@id": `${urlFor(t.lang, v.page)}#video-${key}`,
    name: t.common[v.text].caption,
    description: t.common[v.text].description,
    thumbnailUrl: site.origin + v.poster,
    contentUrl: site.origin + v.src,
    uploadDate: "2026-10-01",
    duration: `PT${v.seconds}S`,
    width: v.width,
    height: v.height,
    inLanguage: t.lang,
    contentLocation: { "@id": `${site.origin}/#chateau` },
  };
}

// Visitor reviews (real ones only, from src/i18n/*.mjs → reviews). Shown on
// the page with stars but deliberately NOT marked up as Review/AggregateRating:
// Google treats reviews a business publishes about itself as self-serving.
const STAR = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
function reviewsSection(t, tinted = false) {
  const r = t.reviews;
  if (!r?.items?.length) return "";
  return `<section class="section reviews${tinted ? " section-tinted" : ""}" aria-labelledby="reviews-title">
  <div class="container narrow">
    <h2 id="reviews-title" class="section-title">${esc(r.title)}</h2>
    ${ornament}
    ${r.items
      .map(
        (item) => `<figure class="review">
      <p class="stars" role="img" aria-label="${esc(r.starsLabel)}">${STAR.repeat(item.rating)}</p>
      <blockquote><p>${quoted(t, item.text)}</p></blockquote>
      <figcaption>${esc(item.author)}</figcaption>
    </figure>`,
      )
      .join("")}
  </div>
</section>`;
}

export function homePage(t) {
  const h = t.home;
  const contact = pathFor(t.lang, "contact");
  const themes = tourCategories.find((c) => c.id === "thematic").tours;
  const body = `
<section class="hero">
  <div class="hero-media"><picture>
    <source type="image/webp" srcset="/assets/img/hero-chateau-de-voltaire-ferney-800.webp 800w, /assets/img/hero-chateau-de-voltaire-ferney.webp 1470w" sizes="100vw">
    <img src="/assets/img/hero-chateau-de-voltaire-ferney.jpg" width="1470" height="800" alt="${esc(h.daytrip.imgAlt)}" fetchpriority="high" decoding="async">
  </picture></div>
  <div class="container hero-content">
    <h1>${esc(h.h1)}</h1>
    <div class="btn-row">
      <a class="btn btn-primary" href="${contact}?type=individual#booking">${esc(t.cta.book)}</a>
      <a class="btn btn-ghost-light" href="${contact}?type=tourist#booking">${esc(t.cta.quote)}</a>
    </div>
  </div>
</section>

<section class="hero-bar">
  <div class="container hero-bar-inner">
    <div>
      <p class="eyebrow">${esc(h.eyebrow)}</p>
      <p class="lead">${esc(h.lead)}</p>
    </div>
    <ul class="hero-facts">
      <li>${icon("leaf")}${esc(t.common.gardensIncluded)}</li>
      <li>${icon("globe")}${esc(t.common.languagesSpoken)}</li>
      <li>${icon("plane")}${esc(h.heroNote)}</li>
    </ul>
  </div>
</section>

<section class="section intro" aria-labelledby="intro-title">
  <div class="container intro-grid">
    ${videoFigure(t, "welcome")}
    <div>
      <h2 id="intro-title">${esc(h.introTitle)}</h2>
      ${ornament}
      ${h.introText.map((p) => `<p>${esc(p)}</p>`).join("")}
      <p class="link-row"><a class="text-link" href="${pathFor(t.lang, "about")}">${esc(h.introLink)} ${icon("arrow")}</a>
      <a class="text-link" href="${pathFor(t.lang, "voltaire")}">${esc(h.voltaireLink)} ${icon("arrow")}</a></p>
    </div>
  </div>
</section>

${weatherSection(t)}

<section class="section section-tinted" aria-labelledby="values-title">
  <div class="container">
    <h2 id="values-title" class="section-title">${esc(h.valuesTitle)}</h2>
    ${ornament}
    <ul class="values-grid">
      ${h.values.map((v, i) => `<li class="value"><span class="value-num" aria-hidden="true">${["I", "II", "III", "IV"][i]}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join("")}
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="aud-title">
  <div class="container">
    <h2 id="aud-title" class="section-title">${esc(h.audiencesTitle)}</h2>
    ${ornament}
    <p class="section-lead">${esc(h.audiencesLead)}</p>
    <ul class="audience-grid">
      ${h.audiences.map((a) => `<li><a class="card audience-card" href="${audienceHref(t, a.key)}">
        <span class="card-icon">${icon(audienceIcon[a.key])}</span>
        <span class="audience-title">${esc(a.title)}</span>
        <span class="audience-text">${esc(a.text)}</span>
        <span class="audience-more">${esc(h.audiencesLink)} ${icon("arrow")}</span>
      </a></li>`).join("")}
    </ul>
  </div>
</section>

${featuredQuote(t)}

<section class="section daytrip" aria-labelledby="daytrip-title">
  <div class="container daytrip-grid">
    <div>
      <h2 id="daytrip-title">${esc(h.daytrip.title)}</h2>
      ${ornament}
      ${h.daytrip.text.map((x) => `<p>${esc(x)}</p>`).join("")}
      <p class="btn-row"><a class="btn btn-primary" href="${pathFor(t.lang, "tours")}">${esc(h.daytrip.link)}</a>
      <a class="btn btn-outline" href="${pathFor(t.lang, "practical")}">${esc(t.nav.practical)}</a></p>
    </div>
    <figure class="daytrip-photo"><img src="/assets/img/chateau-de-voltaire-facade.jpg" alt="${esc(h.daytrip.imgAlt)}" width="640" height="480" loading="lazy" decoding="async"></figure>
  </div>
</section>

${saturdaySection(t)}

<section class="section" aria-labelledby="themes-title">
  <div class="container">
    <h2 id="themes-title" class="section-title">${esc(h.themesTitle)}</h2>
    ${ornament}
    <p class="section-lead">${esc(h.themesLead)}</p>
    <div class="themes-grid">${themes.map((tour) => tourCard(t, tour, { compact: true })).join("")}</div>
  </div>
</section>

<section class="section gallery-dark gallery-home" aria-labelledby="gallery-teaser-title">
  <div class="container">
    <h2 id="gallery-teaser-title" class="section-title">${esc(t.gallery.h1)}</h2>
    ${ornament}
    <p class="section-lead">${esc(t.gallery.lead)}</p>
  </div>
  ${galleryStrip(t)}
  <div class="container">
    <p class="center"><a class="text-link" href="${pathFor(t.lang, "gallery")}">${esc(t.gallery.homeLink)} ${icon("arrow")}</a></p>
  </div>
</section>
${photos.length ? lightbox(t) : ""}

${reviewsSection(t)}

<section class="section section-tinted" aria-labelledby="steps-title">
  <div class="container">
    <h2 id="steps-title" class="section-title">${esc(h.stepsTitle)}</h2>
    ${ornament}
    <ol class="steps">
      ${h.steps.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("")}
    </ol>
  </div>
</section>

${ctaBand(t, h.ctaTitle, h.ctaText)}`;
  return layout(t, "home", body, [videoLd(t, "welcome")]);
}

export function toursPage(t) {
  const tt = t.tours;
  const body = `
${pageHero(t, "tours", tt.h1, tt.lead)}
<nav class="container chip-nav" aria-label="${esc(tt.jump)}">
  <ul>${tourCategories.map((c) => `<li><a class="chip" href="#cat-${c.id}">${esc(tt.categories[c.id].title)}</a></li>`).join("")}</ul>
</nav>
${tourCategories
  .map(
    (c, i) => `<section class="section ${i % 2 ? "section-tinted" : ""}" id="cat-${c.id}" aria-labelledby="cat-${c.id}-title">
  <div class="container">
    <h2 id="cat-${c.id}-title" class="section-title">${esc(tt.categories[c.id].title)}</h2>
    ${ornament}
    <p class="section-lead">${esc(tt.categories[c.id].intro)}</p>
    <div class="tour-grid">${c.tours.map((tour) => tourCard(t, tour)).join("")}</div>
    ${categoryLanding[c.id] ? `<p class="center"><a class="text-link" href="${pathFor(t.lang, categoryLanding[c.id])}">${esc(t.nav[categoryLanding[c.id]])} · ${esc(t.common.more)} ${icon("arrow")}</a></p>` : ""}
  </div>
</section>`,
  )
  .join("\n")}
<section class="quote-band quote-band-white" aria-label="Voltaire">
  <div class="container">
    <blockquote lang="${t.lang}">
      <span class="quote-mark" aria-hidden="true">${quoteMarks(t)[0].trim()}</span>
      <p>${esc(t.common.quote)}</p>
      <footer>${t.common.quoteSource}</footer>
    </blockquote>
  </div>
</section>
<section class="section">
  <div class="container narrow custom-box">
    <h2>${esc(tt.customTitle)}</h2>
    <p>${esc(tt.customText)}</p>
    <a class="btn btn-primary" href="${pathFor(t.lang, "contact")}?type=private#booking">${esc(t.cta.quote)}</a>
  </div>
</section>
${ctaBand(t, t.home.ctaTitle, t.home.ctaText)}`;

  const audienceFor = {
    individual: "Individuals", private: "Families", discovery: "Groups", town: "Groups",
    enlightenment: "Cultural groups", "chateau-life": "Cultural groups", gardens: "Garden lovers",
    corporate: "Business travellers", seniors: "Seniors", schools: "School groups",
  };
  const itemList = {
    "@type": "ItemList",
    "@id": `${urlFor(t.lang, "tours")}#tours`,
    name: tt.h1,
    itemListElement: Object.values(tourById).map((tour, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "TouristTrip",
        name: tt.items[tour.id].title,
        description: tt.items[tour.id].summary,
        url: `${urlFor(t.lang, "tours")}#${tour.id}`,
        touristType: audienceFor[tour.id],
        inLanguage: languages,
        provider: { "@id": `${site.origin}/#business` },
        itinerary: { "@id": `${site.origin}/#chateau` },
        additionalProperty: { "@type": "PropertyValue", name: "duration", value: `PT${tour.duration}M` },
      },
    })),
  };
  return layout(t, "tours", body, [itemList]);
}

function featuredQuote(t) {
  return `<section class="quote-band" aria-label="Voltaire">
  <div class="container">
    <blockquote lang="${t.lang}">
      <span class="quote-mark" aria-hidden="true">${quoteMarks(t)[0].trim()}</span>
      <p>${esc(t.common.featuredQuote)}</p>
      <footer>${t.common.featuredQuoteSource}</footer>
    </blockquote>
    ${ornament}
    <p class="quote-context">${esc(t.common.featuredQuoteContext)}</p>
  </div>
</section>`;
}

// Photo grid on a black ground, each photo with its title and legend. Until
// there are six photos, captioned placeholder frames fill the gaps, skipping
// any subject a photo already covers ("Le salon du château…" replaces the
// "Le salon" frame).
const MIN_TILES = 6;
const photoUrl = (p) => `/assets/gallery/${encodeURIComponent(p.file)}`;
const photoText = (t, p) => ({
  title: p.title[t.lang] || p.title.en || p.title.fr,
  legend: p.legend[t.lang] || p.legend.en || p.legend.fr || "",
});
const photoAlt = (t, p) => {
  const { title } = photoText(t, p);
  return /voltaire/i.test(title) ? `${title}, Ferney-Voltaire` : `${title} — Château de Voltaire, Ferney-Voltaire`;
};

function galleryGrid(t, limit = Infinity) {
  const real = photos.map((p) => ({ p, ...photoText(t, p) }));
  const covered = (ph) => real.some((r) => r.title.toLowerCase().startsWith(ph.toLowerCase()));
  const fillers = t.gallery.placeholders
    .filter((ph) => !covered(ph))
    .slice(0, Math.max(0, MIN_TILES - real.length))
    .map((title) => ({ title }));
  return `<ul class="gallery-grid" data-gallery>${[...real, ...fillers]
    .slice(0, limit)
    .map((item, i) => {
      const caption = `<figcaption><strong>${esc(item.title)}</strong>${item.legend ? `<span>${esc(item.legend)}</span>` : ""}</figcaption>`;
      if (!item.p) {
        return `<li><figure class="gallery-placeholder"><div class="ph">${icon("columns")}<span>${esc(t.gallery.comingSoon)}</span></div>${caption}</figure></li>`;
      }
      const dims = item.p.width ? ` width="${item.p.width}" height="${item.p.height}"` : "";
      return `<li><figure><a href="${photoUrl(item.p)}" data-lightbox="${i}" data-title="${esc(item.title)}" data-legend="${esc(item.legend)}"><img src="${photoUrl(item.p)}" alt="${esc(photoAlt(t, item.p))}"${dims} loading="${i < 3 ? "eager" : "lazy"}" decoding="async"></a>${caption}</figure></li>`;
    })
    .join("")}</ul>`;
}

function lightbox(t) {
  const g = t.gallery;
  return `<dialog class="lightbox" data-lightbox-dialog aria-label="${esc(g.h1)}">
  <figure><img alt=""><figcaption><strong></strong><span></span></figcaption></figure>
  <button type="button" class="lb-btn lb-close" data-lb="close" aria-label="${esc(g.close)}">${icon("close")}</button>
  <button type="button" class="lb-btn lb-prev" data-lb="prev" aria-label="${esc(g.prev)}">${icon("arrow")}</button>
  <button type="button" class="lb-btn lb-next" data-lb="next" aria-label="${esc(g.next)}">${icon("arrow")}</button>
</dialog>`;
}

// Home page filmstrip: every photo in one horizontal, swipeable line with
// arrow buttons; a photo opens full-screen with its legend. Falls back to the
// placeholder grid while there are no photos.
function galleryStrip(t) {
  if (!photos.length) return galleryGrid(t, 3);
  const items = photos
    .map((p, i) => {
      const { title, legend } = photoText(t, p);
      const dims = p.width ? ` width="${p.width}" height="${p.height}"` : "";
      return `<li class="strip-item"><figure><a href="${photoUrl(p)}" data-lightbox="${i}" data-title="${esc(title)}" data-legend="${esc(legend)}"><img src="${photoUrl(p)}" alt="${esc(photoAlt(t, p))}"${dims} loading="${i < 4 ? "eager" : "lazy"}" decoding="async"></a><figcaption>${esc(title)}</figcaption></figure></li>`;
    })
    .join("");
  return `<div class="strip" data-strip>
      <button type="button" class="strip-btn strip-prev" data-strip-prev aria-label="${esc(t.gallery.prev)}" hidden>${icon("arrow")}</button>
      <ul class="strip-track" data-strip-track tabindex="0" aria-label="${esc(t.gallery.h1)}">${items}</ul>
      <button type="button" class="strip-btn strip-next" data-strip-next aria-label="${esc(t.gallery.next)}" hidden>${icon("arrow")}</button>
    </div>`;
}

// ImageObject entries for structured data and the sitemap.
export function galleryImages(t) {
  return photos.map((p) => {
    const { title, legend } = photoText(t, p);
    return {
      "@type": "ImageObject",
      contentUrl: site.origin + photoUrl(p),
      url: site.origin + photoUrl(p),
      name: title,
      caption: legend || title,
      description: legend || title,
      ...(p.width ? { width: p.width, height: p.height } : {}),
      inLanguage: t.lang,
      contentLocation: { "@id": `${site.origin}/#chateau` },
      creditText: site.guideName,
      copyrightNotice: `© ${site.guideName}`,
    };
  });
}

export function galleryPage(t) {
  const g = t.gallery;
  const body = `
${pageHero(t, "gallery", g.h1, g.lead)}
<section class="section gallery-dark" aria-label="${esc(g.h1)}">
  <div class="container">
    ${galleryGrid(t)}
  </div>
</section>
${lightbox(t)}
${featuredQuote(t)}
${ctaBand(t, t.home.ctaTitle, t.home.ctaText)}`;
  const images = galleryImages(t);
  const ld = images.length
    ? [{
        "@type": "ImageGallery",
        "@id": `${urlFor(t.lang, "gallery")}#gallery`,
        name: g.h1,
        description: t.meta.gallery.description,
        inLanguage: t.lang,
        about: { "@id": `${site.origin}/#chateau` },
        primaryImageOfPage: images[0],
        image: images,
      }]
    : [];
  // Share the first real photo when the gallery link is posted on social networks.
  const og = photos[0] ? { url: site.origin + photoUrl(photos[0]), width: photos[0].width, height: photos[0].height, alt: photoAlt(t, photos[0]) } : null;
  return layout(t, "gallery", body, ld, { og });
}

// Landing pages (group hub, corporate, seniors, thematic) share one layout:
// intro, formats, reasons, a note for organisers, FAQ and call to action.
const landingFormatLinks = {
  group: (t) => [pathFor(t.lang, "corporate"), pathFor(t.lang, "seniors"), pathFor(t.lang, "thematic"), `${pathFor(t.lang, "tours")}#cat-groups`, `${pathFor(t.lang, "tours")}#schools`],
};
const landingIcons = {
  group: ["handshake", "bench", "book", "columns", "pupil"],
  corporate: ["users", "handshake", "key"],
  seniors: ["bench", "access", "quill"],
  thematic: ["book", "map", "quill", "leaf"],
};
const landingContactType = { group: "tourist", corporate: "corporate", seniors: "seniors", thematic: "private" };
const landingTripTypes = { group: "Groups", corporate: "Business travellers", seniors: "Seniors", thematic: "Cultural groups" };

export function landingPage(t, key) {
  const d = t[key];
  const links = landingFormatLinks[key]?.(t) || [];
  const contact = `${pathFor(t.lang, "contact")}?type=${landingContactType[key]}#booking`;
  const body = `
${pageHero(t, key, d.h1, d.lead)}
<section class="section">
  <div class="container narrow landing-intro">
    <h2>${esc(d.introTitle)}</h2>
    ${ornament}
    ${d.intro.map((x) => `<p>${esc(x)}</p>`).join("")}
    <p class="btn-row"><a class="btn btn-primary" href="${contact}">${esc(t.cta.quote)}</a></p>
  </div>
</section>
<section class="section section-tinted" aria-labelledby="formats-title">
  <div class="container">
    <h2 id="formats-title" class="section-title">${esc(d.formatsTitle)}</h2>
    ${ornament}
    <div class="info-grid${d.formats.length === 4 ? " info-grid-2" : ""}">
      ${d.formats
        .map((f, i) => {
          const title = links[i] ? `<a href="${links[i]}">${esc(f.title)}</a>` : esc(f.title);
          return `<article class="card info-card${links[i] ? " link-card" : ""}"><span class="card-icon">${icon(landingIcons[key][i] || "check")}</span><h3>${title}</h3><p>${esc(f.text)}</p></article>`;
        })
        .join("")}
    </div>
  </div>
</section>
<section class="section">
  <div class="container about-split">
    <div class="facts">
      <h2>${esc(d.whyTitle)}</h2>
      <ul class="checklist checklist-lg">${d.why.map((x) => `<li>${icon("check")}${esc(x)}</li>`).join("")}</ul>
    </div>
    <aside class="pull-quote note-box"><h2>${esc(d.noteTitle)}</h2><p>${esc(d.noteText)}</p></aside>
  </div>
</section>
${key === "seniors" ? reviewsSection(t) : ""}
<section class="section section-tinted" aria-labelledby="landing-faq-title">
  <div class="container narrow">
    <h2 id="landing-faq-title" class="section-title">${esc(d.faqTitle)}</h2>
    ${ornament}
    <div class="faq">${d.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>
  </div>
</section>
${ctaBand(t, d.ctaTitle, d.ctaText)}`;

  const ld = [
    {
      "@type": "TouristTrip",
      "@id": `${urlFor(t.lang, key)}#trip`,
      name: d.h1,
      description: t.meta[key].description,
      url: urlFor(t.lang, key),
      touristType: landingTripTypes[key],
      inLanguage: tourLanguages,
      provider: { "@id": `${site.origin}/#business` },
      itinerary: { "@id": `${site.origin}/#chateau` },
      ...offerLd(t, key),
    },
    {
      "@type": "FAQPage",
      "@id": `${urlFor(t.lang, key)}#faq`,
      mainEntity: d.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return layout(t, key, body, ld);
}

// Price data for structured data, only when real prices are set in config.
function offerLd(t, key) {
  const price = site.prices?.[key];
  if (!price) return {};
  return {
    offers: {
      "@type": "Offer",
      price: price.from,
      priceCurrency: site.currency || "EUR",
      url: `${site.origin}${pathFor(t.lang, "contact")}`,
      ...(price.description ? { description: price.description } : {}),
    },
  };
}

// ---------------------------------------------------------------- prices

const money = (t, amount) =>
  new Intl.NumberFormat(langMeta[t.lang].locale.replace("_", "-"), { style: "currency", currency: site.currency || "EUR", maximumFractionDigits: 0 }).format(amount);

function priceLine(t, line) {
  const L = t.pricing.labels;
  const note = line.note ? ` <span class="price-note">· ${esc(L[line.note])}</span>` : "";
  if (line.unit === "under7") return `<li class="price-free">${esc(L.under7)}</li>`;
  if (line.unit === "minimum") return `<li class="price-min">${esc(L.minimum)} ${money(t, line.amount)}</li>`;
  if (line.unit === "from") return `<li><span class="price-from">${esc(L.from)}</span> <strong>${money(t, line.amount)}</strong>${note}</li>`;
  return `<li><strong>${money(t, line.amount)}</strong> ${esc(L[line.unit])}${note}</li>`;
}

// Link to the request form with the group type and the package noted.
const orderLink = (t, id) => `${pathFor(t.lang, "contact")}?type=${packages.find((pk) => pk.id === id).contactType}&tour=${id}#booking`;

function packageCard(t, pk) {
  const P = t.pricing;
  return `<article class="card price-card${pk.saturday ? " price-card-featured" : ""}" id="price-${pk.id}">
      ${pk.saturday ? `<p class="price-tag">${icon("clock")}${esc(P.labels.saturday)}</p>` : ""}
      <h3>${esc(P.packages[pk.id].name)}</h3>
      <p>${esc(P.packages[pk.id].desc)}</p>
      <ul class="price-lines">${pk.lines.map((l) => priceLine(t, l)).join("")}</ul>
      <div class="btn-row"><a class="btn btn-primary btn-sm" href="${orderLink(t, pk.id)}">${esc(t.pricing.labels.book)}</a></div>
    </article>`;
}

function pricingSection(t) {
  const P = t.pricing;
  return `<section class="section" id="packages" aria-labelledby="prices-title">
  <div class="container">
    <h2 id="prices-title" class="section-title">${esc(P.title)}</h2>
    ${ornament}
    <p class="section-lead">${esc(P.lead)}</p>
    <div class="price-grid">${packages.map((pk) => packageCard(t, pk)).join("")}</div>
    <p class="price-excluded">${icon("key")}${esc(P.excluded)}</p>
    <p class="price-policy">${esc(P.policy)}</p>
  </div>
</section>`;
}

// Practical page: a short pointer to the prices page.
function pricesTeaser(t) {
  const P = t.pricing;
  return `<section class="section" id="prices" aria-labelledby="prices-teaser-title">
  <div class="container narrow prices-teaser">
    <h2 id="prices-teaser-title" class="section-title">${esc(P.title)}</h2>
    ${ornament}
    <p class="section-lead">${esc(P.lead)}</p>
    <p class="price-excluded">${icon("key")}${esc(P.excluded)}</p>
    <p class="btn-row btn-row-center"><a class="btn btn-primary" href="${pathFor(t.lang, "prices")}">${esc(t.prices.seeAll)}</a></p>
  </div>
</section>`;
}

// Home page: the Saturday château & market package, with the statue photo.
function saturdaySection(t) {
  const pk = packages.find((p) => p.saturday);
  if (!pk) return "";
  const P = t.pricing;
  return `<section class="section section-tinted saturday" aria-labelledby="saturday-title">
  <div class="container daytrip-grid">
    <figure class="daytrip-photo"><img src="${pk.photo}" alt="${esc(P.packages[pk.id].name)} — Ferney-Voltaire" width="1200" height="1600" loading="lazy" decoding="async"></figure>
    <div>
      <p class="eyebrow">${esc(t.home.saturdayEyebrow)} · ${esc(P.labels.saturday)}</p>
      <h2 id="saturday-title">${esc(P.packages[pk.id].name)}</h2>
      ${ornament}
      <p>${esc(P.packages[pk.id].desc)}</p>
      <ul class="price-lines">${pk.lines.map((l) => priceLine(t, l)).join("")}</ul>
      <p class="btn-row"><a class="btn btn-primary" href="${orderLink(t, pk.id)}">${esc(P.labels.book)}</a>
      <a class="btn btn-outline" href="${pathFor(t.lang, "prices")}">${esc(P.title)}</a></p>
    </div>
  </div>
</section>`;
}

// All packages as an OfferCatalog (structured data), admission excluded.
function offerCatalogLd(t) {
  return {
    "@type": "OfferCatalog",
    "@id": `${urlFor(t.lang, "prices")}#packages`,
    name: t.pricing.title,
    itemListElement: packages.map((pk) => {
      const main = pk.lines.find((l) => l.amount > 0);
      return {
        "@type": "Offer",
        name: t.pricing.packages[pk.id].name,
        description: t.pricing.packages[pk.id].desc,
        price: main.amount,
        priceCurrency: site.currency || "EUR",
        url: `${urlFor(t.lang, "prices")}#price-${pk.id}`,
        seller: { "@id": `${site.origin}/#business` },
      };
    }),
  };
}

// Prices page: every package; "Book" opens the request form.
export function pricesPage(t) {
  const X = t.prices;
  const body = `
${pageHero(t, "prices", X.h1, X.lead)}
${pricingSection(t)}
${ctaBand(t, t.home.ctaTitle, t.home.ctaText)}`;
  return layout(t, "prices", body, [offerCatalogLd(t)]);
}

// Home page: Ferney-Voltaire forecast for the coming days (Open-Meteo, no
// key needed). The section stays hidden without JavaScript.
function weatherSection(t) {
  const W = t.weather;
  return `<section class="section weather" aria-labelledby="weather-title" data-weather hidden
  data-locale="${langMeta[t.lang].locale.replace("_", "-")}" data-codes="${esc(JSON.stringify(W.codes))}"
  data-max="${esc(W.max)}" data-min="${esc(W.min)}" data-rain="${esc(W.rain)}" data-error="${esc(W.error)}">
  <div class="container weather-grid">
    <div class="weather-intro">
      <p class="eyebrow">Ferney-Voltaire · 46.26° N, 6.11° E</p>
      <h2 id="weather-title">${esc(W.title)}</h2>
      ${ornament}
      <p>${esc(W.lead)}</p>
    </div>
    <div class="weather-card">
      <div class="weather-now" data-weather-now aria-live="polite"><p class="weather-loading">${esc(W.loading)}</p></div>
      <div class="weather-days" role="group" aria-label="${esc(W.dayLabel)}" data-weather-days></div>
      <p class="weather-source">${esc(W.source)}</p>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------- Voltaire page

export function voltairePage(t) {
  const v = t.voltaire;
  const body = `
${pageHero(t, "voltaire", v.h1, v.lead)}
<section class="section">
  <div class="container intro-grid">
    <figure class="portrait"><img src="/assets/img/chateau-de-voltaire-facade.jpg" alt="${esc(t.footer.photoAlt)}" width="640" height="480" loading="lazy" decoding="async"></figure>
    <div>
      <h2>${esc(v.chateauTitle)}</h2>
      ${ornament}
      ${v.chateau.map((x) => `<p>${esc(x)}</p>`).join("")}
    </div>
  </div>
</section>
<section class="section section-tinted" aria-labelledby="life-title">
  <div class="container narrow">
    <figure class="oval-portrait"><span class="oval-frame"><img src="/assets/img/voltaire-buste-marbre-portrait.jpg" alt="Voltaire — Château de Voltaire, Ferney-Voltaire" width="480" height="634" loading="lazy" decoding="async"></span></figure>
    <h2 id="life-title" class="section-title">${esc(v.lifeTitle)}</h2>
    ${ornament}
    <ol class="timeline">${v.timeline.map((e) => `<li><span class="timeline-year">${esc(e.year)}</span><p>${esc(e.text)}</p></li>`).join("")}</ol>
  </div>
</section>
<section class="section quotes-section" aria-labelledby="quotes-title">
  <div class="container">
    <h2 id="quotes-title" class="section-title">${esc(v.quotesTitle)}</h2>
    ${ornament}
    <div class="quote-grid">${v.quotes
      .map((q) => `<figure class="quote-card"><blockquote lang="${t.lang}"><p>${quoted(t, q.text)}</p></blockquote><figcaption>Voltaire, <cite>${esc(q.source)}</cite></figcaption></figure>`)
      .join("")}</div>
  </div>
</section>
<section class="section section-tinted">
  <div class="container narrow myth">
    <h2>${esc(v.mythTitle)}</h2>
    <p>${esc(v.mythText)}</p>
  </div>
</section>
${ctaBand(t, v.ctaTitle, v.ctaText)}`;
  const person = {
    "@type": "Person",
    "@id": `${site.origin}/#voltaire`,
    name: "Voltaire",
    alternateName: "François-Marie Arouet",
    birthDate: "1694-11-21",
    deathDate: "1778-05-30",
    birthPlace: { "@type": "Place", name: "Paris" },
    deathPlace: { "@type": "Place", name: "Paris" },
    image: `${site.origin}/assets/img/voltaire-buste-marbre-portrait.jpg`,
    sameAs: ["https://www.wikidata.org/wiki/Q9068"],
  };
  return layout(t, "voltaire", body, [person, { "@type": "WebPage", "@id": `${urlFor(t.lang, "voltaire")}#webpage`, about: { "@id": `${site.origin}/#voltaire` } }]);
}

export function aboutPage(t) {
  const a = t.about;
  const body = `
${pageHero(t, "about", a.h1, a.lead)}
<section class="section">
  <div class="container intro-grid">
    <figure class="portrait"><img src="${SYLVIE_PHOTO}" alt="${esc(t.common.sylviePhotoAlt)}" width="800" height="1000" loading="lazy" decoding="async"></figure>
    <div>
      <h2>${esc(a.storyTitle)}</h2>
      ${ornament}
      ${a.story.map((p) => `<p>${esc(p)}</p>`).join("")}
    </div>
  </div>
</section>
<section class="section section-tinted" aria-labelledby="approach-title">
  <div class="container">
    <h2 id="approach-title" class="section-title">${esc(a.approachTitle)}</h2>
    ${ornament}
    <ul class="values-grid values-grid-3">
      ${a.approach.map((v, i) => `<li class="value"><span class="value-num" aria-hidden="true">${["I", "II", "III"][i]}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`).join("")}
    </ul>
  </div>
</section>
<section class="section">
  <div class="container intro-grid about-video">
    ${videoFigure(t, "park")}
    <div class="facts">
      <h2>${esc(a.factsTitle)}</h2>
      ${ornament}
      <ul class="checklist checklist-lg">${a.facts.map((f) => `<li>${icon("check")}${esc(f)}</li>`).join("")}</ul>
      <blockquote class="pull-quote"><p>${quoted(t, a.quoteText)}</p><footer>— ${esc(site.guideName)}</footer></blockquote>
    </div>
  </div>
</section>
${ctaBand(t, a.ctaTitle, a.ctaText)}`;
  return layout(t, "about", body, [videoLd(t, "park")], { og: { url: site.origin + SYLVIE_PHOTO, width: 800, height: 1000, alt: t.common.sylviePhotoAlt } });
}

export function practicalPage(t) {
  const p = t.practical;
  const accessIcons = ["car", "bus", "users", "plane"];
  const body = `
${pageHero(t, "practical", p.h1, p.lead)}
<section class="section" aria-labelledby="meet-title">
  <div class="container">
    <h2 id="meet-title" class="section-title">${esc(p.meetingTitle)}</h2>
    ${ornament}
    <div class="info-grid">
      ${p.meeting.map((m, i) => `<article class="card info-card"><span class="card-icon">${icon("pin")}</span><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></article>`).join("")}
    </div>
    <p class="map-link"><a class="text-link" href="https://www.openstreetmap.org/search?query=${encodeURIComponent("Château de Voltaire, Ferney-Voltaire")}" rel="noopener" target="_blank">${icon("map")} OpenStreetMap — Château de Voltaire, Ferney-Voltaire</a></p>
  </div>
</section>
<section class="section section-tinted" aria-labelledby="access-title">
  <div class="container">
    <h2 id="access-title" class="section-title">${esc(p.accessTitle)}</h2>
    ${ornament}
    <div class="info-grid">
      ${p.access.map((m, i) => `<article class="card info-card"><span class="card-icon">${icon(accessIcons[i])}</span><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></article>`).join("")}
    </div>
  </div>
</section>
<section class="section" id="hours" aria-labelledby="hours-title">
  <div class="container two-col hours-grid">
    <div>
      <h2 id="hours-title">${icon("clock", "icon icon-title")} ${esc(p.hoursTitle)}</h2>
      <p>${esc(p.hoursLead)}</p>
      <table class="duration-table">
        <tbody>${p.hoursRows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody>
      </table>
      <ul class="hours-notes">${p.hoursNotes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <p class="hours-source">${esc(p.hoursSource)}</p>
    </div>
    <div class="card admission-card">
      <h2>${icon("key", "icon icon-title")} ${esc(p.admissionTitle)}</h2>
      <p class="admission-price">${esc(p.admissionPrice)}</p>
      <p>${esc(p.admissionText)}</p>
      <p class="admission-free">${esc(p.admissionFree)}</p>
    </div>
  </div>
</section>
${pricesTeaser(t)}
<section class="section section-tinted" aria-labelledby="dur-title">
  <div class="container two-col">
    <div>
      <h2 id="dur-title">${icon("clock", "icon icon-title")} ${esc(p.durationTitle)}</h2>
      <p>${esc(p.durationLead)}</p>
      <table class="duration-table">
        <tbody>${p.durationRows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
    <div>
      <h2>${icon("access", "icon icon-title")} ${esc(p.accessibilityTitle)}</h2>
      ${p.accessibility.map((x) => `<p>${esc(x)}</p>`).join("")}
      <h2 class="mt">${esc(p.tipsTitle)}</h2>
      <ul class="checklist">${p.tips.map((x) => `<li>${icon("check")}${esc(x)}</li>`).join("")}</ul>
    </div>
  </div>
</section>
<section class="section section-tinted" aria-labelledby="faq-title">
  <div class="container narrow">
    <h2 id="faq-title" class="section-title">${esc(p.faqTitle)}</h2>
    ${ornament}
    <div class="faq">
      ${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}
    </div>
  </div>
</section>
${ctaBand(t, t.home.ctaTitle, t.home.ctaText)}`;

  const faqLd = {
    "@type": "FAQPage",
    "@id": `${urlFor(t.lang, "practical")}#faq`,
    mainEntity: p.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return layout(t, "practical", body, [faqLd]);
}

export function contactPage(t) {
  const c = t.contact;
  const f = c.fields;
  const req = `<span class="req" aria-hidden="true">*</span>`;
  // ?tour=… pre-fills the message: tours and price packages (packages win).
  const tourTitles = {
    ...Object.fromEntries(Object.keys(t.tours.items).map((id) => [id, t.tours.items[id].title])),
    ...Object.fromEntries(packages.map((pk) => [pk.id, t.pricing.packages[pk.id].name])),
  };
  const themes = tourCategories.find((cat) => cat.id === "thematic").tours;
  // Without JavaScript the form posts straight to FormSubmit (non-AJAX URL).
  const action = site.formEndpoint ? site.formEndpoint.replace("/ajax/", "/") : "#booking";
  const body = `
${pageHero(t, "contact", c.h1, c.lead)}
<section class="section" id="booking">
  <div class="container contact-grid">
    <form class="card booking-form" action="${esc(action)}" method="post"${site.formEndpoint ? "" : ' enctype="text/plain"'} novalidate data-booking-form
      data-endpoint="${esc(site.formEndpoint)}"
      data-msg-success="${esc(c.success)}" data-msg-error="${esc(c.error)}"
      data-msg-invalid="${esc(c.invalid)}" data-msg-sending="${esc(f.sending)}" data-tour-prefix="${esc(c.tourPrefix)}"
      data-tours="${esc(JSON.stringify(tourTitles))}">
      <h2>${esc(c.formTitle)}</h2>
      <p class="form-note">${req} = ${esc(f.required)}</p>
      <div class="form-grid">
        <div class="field">
          <label for="f-name">${esc(f.name)} ${req}</label>
          <input id="f-name" name="name" type="text" autocomplete="name" required>
        </div>
        <div class="field">
          <label for="f-email">${esc(f.email)} ${req}</label>
          <input id="f-email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="field">
          <label for="f-phone">${esc(f.phone)}</label>
          <input id="f-phone" name="phone" type="tel" autocomplete="tel">
        </div>
        <div class="field">
          <label for="f-type">${esc(f.groupType)} ${req}</label>
          <select id="f-type" name="group_type" required>
            <option value="">${esc(f.choose)}</option>
            ${groupTypes.map((g) => `<option value="${g}">${esc(c.groupTypes[g])}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="f-size">${esc(f.groupSize)} ${req}</label>
          <input id="f-size" name="group_size" type="number" min="1" max="500" inputmode="numeric" required>
        </div>
        <div class="field">
          <label for="f-theme">${esc(f.thematic)} ${req}</label>
          <select id="f-theme" name="theme" required>
            <option value="no">${esc(f.themeNo)}</option>
            ${themes.map((th) => `<option value="${th.id}">${esc(t.tours.items[th.id].title)}</option>`).join("")}
            <option value="other">${esc(f.themeOther)}</option>
          </select>
        </div>
        <div class="field">
          <label for="f-date">${esc(f.date)} ${req}</label>
          <input id="f-date" name="preferred_date" type="date" required>
        </div>
        <div class="field">
          <label for="f-lang">${esc(f.language)} ${req}</label>
          <select id="f-lang" name="tour_language" required>
            ${tourLanguages.map((l) => `<option value="${langMeta[l].name}"${l === (tourLanguages.includes(t.lang) ? t.lang : "en") ? " selected" : ""}>${langMeta[l].name}</option>`).join("")}
          </select>
        </div>
        <div class="field field-full">
          <label for="f-message">${esc(f.message)}</label>
          <textarea id="f-message" name="message" rows="6" placeholder="${esc(f.messagePlaceholder)}"></textarea>
        </div>
        <div class="field field-full hp" aria-hidden="true">
          <label for="f-website">Website</label>
          <input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
        <input type="hidden" name="site_language" value="${t.lang}">
        <div class="field field-full field-check">
          <input id="f-consent" name="consent" type="checkbox" value="yes" required>
          <label for="f-consent">${esc(f.consent)} ${req}</label>
        </div>
      </div>
      <div class="form-status" role="status" aria-live="polite" data-form-status></div>
      <button class="btn btn-primary btn-block" type="submit">${esc(f.submit)}</button>
      <p class="form-privacy">${esc(c.privacy)}</p>
    </form>

    <aside class="contact-aside">
      <div class="card">
        <h2>${esc(t.footer.languages)}</h2>
        <ul class="footer-contact contact-list">
          <li>${icon("globe")}<span>${esc(t.common.languagesSpoken)}</span></li>
          <li>${icon("leaf")}<span>${esc(t.common.gardensIncluded)}</span></li>
        </ul>
      </div>
      <div class="card">
        <h2>${esc(c.responseTitle)}</h2>
        <ol class="steps steps-compact">${c.response.map((r) => `<li><p>${esc(r)}</p></li>`).join("")}</ol>
      </div>
      <a class="text-link" href="${pathFor(t.lang, "practical")}">${esc(t.nav.practical)} ${icon("arrow")}</a>
    </aside>
  </div>
</section>`;
  return layout(t, "contact", body);
}

export function notFoundPage(t) {
  return `<!doctype html>
<html lang="${t.lang}">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404 — ${esc(t.notFound.title)} | ${esc(site.brand)}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="stylesheet" href="${fontsUrl(t.lang)}">
  <link rel="stylesheet" href="/assets/styles.css?v=${ASSET_VERSION}">
</head>
<body>
<main class="section notfound">
  <div class="container narrow">
    <p class="eyebrow">404</p>
    <h1>${esc(t.notFound.title)}</h1>
    ${ornament}
    <p class="lead">${esc(t.notFound.text)}</p>
    <p class="btn-row btn-row-center">${languages.map((l) => `<a class="btn btn-outline btn-sm" href="/${l}/" lang="${l}">${flagImg(l)} ${esc(langMeta[l].name)}</a>`).join("")}</p>
  </div>
</main>
</body>
</html>
`;
}

// Root "/" page: picks the visitor's language (saved choice first, then the
// browser's), and doubles as the x-default language chooser for crawlers.
export function rootPage(all) {
  const t = all.fr;
  const title = "Château de Voltaire — Sylvie, guide · Visites guidées · Guided tours · Führungen · Экскурсии";
  const description = "Visites guidées du Château de Voltaire à Ferney-Voltaire · Voltaire castle guided tours · Führungen Schloss Voltaire · Экскурсии в замок Вольтера.";
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${site.origin}/">
  ${languages.map((l) => `<link rel="alternate" hreflang="${l}" href="${urlFor(l, "home")}">`).join("\n  ")}
  <link rel="alternate" hreflang="x-default" href="${site.origin}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${site.origin}/">
  <meta property="og:image" content="${site.origin}/assets/og/og-fr.png">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#111111">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <script>
    (function () {
      var langs = ${JSON.stringify(languages)}, pick = null;
      try { pick = localStorage.getItem("lang"); } catch (e) {}
      if (langs.indexOf(pick) < 0) {
        var prefs = navigator.languages || [navigator.language || ""];
        for (var i = 0; i < prefs.length && !pick; i++) {
          var code = String(prefs[i]).slice(0, 2).toLowerCase();
          if (langs.indexOf(code) >= 0) pick = code;
        }
      }
      location.replace("/" + (pick || "${"en"}") + "/");
    })();
  </script>
  <link rel="stylesheet" href="${FONTS_URL}">
  <link rel="stylesheet" href="/assets/styles.css?v=${ASSET_VERSION}">
</head>
<body>
<main class="section notfound">
  <div class="container narrow">
    <p><img class="brand-mark brand-mark-lg" src="/assets/img/voltaire-buste-marbre.jpg" alt="" width="72" height="72" decoding="async"></p>
    <h1>Château de Voltaire · Ferney-Voltaire</h1>
    ${ornament}
    <ul class="root-langs">
      ${languages.map((l) => `<li><a class="btn btn-outline" href="/${l}/" lang="${l}" hreflang="${l}" dir="${langMeta[l].dir || "ltr"}">${flagImg(l, 28)}<strong>${esc(langMeta[l].name)}</strong><span>${esc(all[l].home.h1)}</span></a></li>`).join("")}
    </ul>
  </div>
</main>
</body>
</html>
`;
}
