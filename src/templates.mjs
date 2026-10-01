import { site, languages, pages, slugs, tourCategories, groupTypes } from "./config.mjs";
import { chateauSvg, portraitSvg, ornament, icon } from "./art.mjs";
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
const QUOTES = { fr: ["« ", " »"], en: ["“", "”"], de: ["„", "“"], ru: ["«", "»"] };
const quoted = (t, s) => `${QUOTES[t.lang][0]}${esc(s)}${QUOTES[t.lang][1]}`;
const colon = (t) => (t.lang === "fr" ? "\u00a0:" : ":");

const ASSET_VERSION = Date.now().toString(36);

// Default group type and form preset for each tour, used by "Book this tour".
const tourGroupType = {
  classic: "individual", private: "individual", discovery: "tourist", town: "tourist",
  enlightenment: "private", "chateau-life": "private", gardens: "private",
  corporate: "corporate", seniors: "seniors", schools: "school",
};

const audienceAnchor = {
  individual: "cat-individual", groups: "cat-groups",
  corporate: "corporate", seniors: "seniors", schools: "schools",
};
const audienceIcon = { individual: "key", groups: "users", corporate: "handshake", seniors: "bench", schools: "pupil" };

const fmtDuration = (t, min) => {
  if (min < 60) return `${min} ${t.common.minutes}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hour = { fr: "h", en: "h", de: "Std.", ru: "ч" }[t.lang];
  return m ? `${h} ${hour} ${m}` : `${h} ${hour}`;
};

// ---------------------------------------------------------------- layout

function head(t, page, { title, description }, og = null) {
  const canonical = urlFor(t.lang, page);
  const ogImage = og?.url || `${site.origin}/assets/og/og-${t.lang}.png`;
  const alternates = languages
    .map((l) => `<link rel="alternate" hreflang="${l}" href="${urlFor(l, page)}">`)
    .join("\n  ");
  const xDefault = page === "home" ? `${site.origin}/` : urlFor("en", page);
  const otherLocales = languages
    .filter((l) => l !== t.lang)
    .map((l) => `<meta property="og:locale:alternate" content="${LOCALES[l]}">`)
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
  <meta name="theme-color" content="#1f2a44">
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
  <meta property="og:image:alt" content="${esc(og?.alt || t.ogImageAlt)}">
  <meta property="og:locale" content="${t.locale}">
  ${otherLocales}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ogImage}">

  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS_URL}">
  <link rel="stylesheet" href="/assets/styles.css?v=${ASSET_VERSION}">
  <script src="/assets/main.js?v=${ASSET_VERSION}" defer></script>
</head>`;
}

export const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Inter:ital,wght@0,400;0,500;0,600;1,400&display=swap";

const LOCALES = { fr: "fr_FR", en: "en_GB", de: "de_DE", ru: "ru_RU" };
const SHORT = { fr: "FR", en: "EN", de: "DE", ru: "RU" };

function langSwitcher(t, page, extraClass = "") {
  return `<nav class="lang-switch ${extraClass}" aria-label="${esc(t.nav.langLabel)}">
      <ul>${languages
        .map((l) => {
          const current = l === t.lang;
          return `<li><a href="${pathFor(l, page)}" hreflang="${l}" lang="${l}" data-lang="${l}"${
            current ? ' aria-current="true"' : ""
          } title="${esc(LANG_NAMES[l])}"><span aria-hidden="true">${SHORT[l]}</span><span class="sr-only">${esc(LANG_NAMES[l])}</span></a></li>`;
        })
        .join("")}</ul>
    </nav>`;
}
const LANG_NAMES = { fr: "Français", en: "English", de: "Deutsch", ru: "Русский" };

function header(t, page) {
  const links = pages
    .filter((p) => p !== "contact")
    .map(
      (p) =>
        `<li><a href="${pathFor(t.lang, p)}"${p === page ? ' aria-current="page"' : ""}>${esc(t.nav[p])}</a></li>`,
    )
    .join("");
  return `<a class="skip-link" href="#main">${esc(t.nav.skip)}</a>
<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="${pathFor(t.lang, "home")}" aria-label="${esc(site.brand)}">
      <span class="brand-mark" aria-hidden="true">S</span>
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
      <p class="footer-logo"><span class="brand-mark" aria-hidden="true">S</span> ${esc(site.guideName)}</p>
      <p>${esc(t.footer.tagline)}</p>
      <p class="footer-langs">${esc(t.common.languagesSpoken)}</p>
    </div>
    <nav aria-label="${esc(t.footer.explore)}">
      <h2 class="footer-title">${esc(t.footer.explore)}</h2>
      <ul>${pages.map((p) => `<li><a href="${pathFor(t.lang, p)}">${esc(t.nav[p])}</a></li>`).join("")}</ul>
    </nav>
    <div>
      <h2 class="footer-title">${esc(t.footer.contact)}</h2>
      <ul class="footer-contact">
        <li>${icon("mail")}<a href="mailto:${site.email}">${site.email}</a></li>
        <li>${icon("phone")}<a href="tel:${site.phoneHref}">${esc(site.phone)}</a></li>
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

function breadcrumbs(t, page, label) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol><li><a href="${pathFor(t.lang, "home")}">${esc(t.common.breadcrumbHome)}</a></li><li aria-current="page">${esc(label)}</li></ol>
    </nav>`;
}

function breadcrumbLd(t, page) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${urlFor(t.lang, page)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.common.breadcrumbHome, item: urlFor(t.lang, "home") },
      { "@type": "ListItem", position: 2, name: t.nav[page], item: urlFor(t.lang, page) },
    ],
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
      url: urlFor(t.lang, "about"),
    },
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": `${site.origin}/#business`,
      name: site.brand,
      description: t.meta.home.description,
      url: urlFor(t.lang, "home"),
      email: site.email,
      telephone: site.phone,
      image: `${site.origin}/assets/og/og-${t.lang}.png`,
      address: addr,
      areaServed: ["Ferney-Voltaire", "Pays de Gex", "Genève", "Geneva"],
      founder: { "@id": `${site.origin}/#sylvie` },
      availableLanguage: ["French", "English", "German", "Russian"],
    },
    {
      "@type": ["TouristAttraction", "LandmarksOrHistoricalBuildings"],
      "@id": `${site.origin}/#chateau`,
      name: "Château de Voltaire",
      address: addr,
      sameAs: ["https://www.chateau-ferney-voltaire.fr/"],
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
      ${breadcrumbs(t, page, t.nav[page])}
      <h1>${esc(h1)}</h1>
      ${ornament}
      <p class="lead">${esc(lead)}</p>
    </div>
  </section>`;
}

export function layout(t, page, body, extraLd = [], { og = null } = {}) {
  const meta = t.meta[page];
  return `<!doctype html>
<html lang="${t.lang}" dir="ltr">
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
      <a class="btn btn-outline btn-sm" href="${bookHref}">${esc(
        ["individual"].includes(tourGroupType[tour.id]) ? t.tours.labels.book : t.tours.labels.quote,
      )} ${icon("arrow")}</a>
    </article>`;
}

export function homePage(t) {
  const h = t.home;
  const contact = pathFor(t.lang, "contact");
  const themes = tourCategories.find((c) => c.id === "thematic").tours;
  const body = `
<section class="hero">
  <div class="hero-media">${chateauSvg({ title: t.ogImageAlt, cover: true })}</div>
  <div class="container hero-content">
    <p class="eyebrow">${esc(h.eyebrow)}</p>
    <h1>${esc(h.h1)}</h1>
    <p class="lead">${esc(h.lead)}</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${contact}?type=individual#booking">${esc(t.cta.book)}</a>
      <a class="btn btn-ghost-light" href="${contact}?type=tourist#booking">${esc(t.cta.quote)}</a>
    </div>
    <ul class="hero-facts">
      <li>${icon("globe")}${esc(t.common.languagesSpoken)}</li>
      <li>${icon("plane")}${esc(h.heroNote)}</li>
    </ul>
  </div>
</section>

<section class="section intro" aria-labelledby="intro-title">
  <div class="container intro-grid">
    <figure class="portrait">${portraitSvg(t.about.portraitAlt)}</figure>
    <div>
      <h2 id="intro-title">${esc(h.introTitle)}</h2>
      ${ornament}
      ${h.introText.map((p) => `<p>${esc(p)}</p>`).join("")}
      <a class="text-link" href="${pathFor(t.lang, "about")}">${esc(h.introLink)} ${icon("arrow")}</a>
    </div>
  </div>
</section>

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
      ${h.audiences.map((a) => `<li><a class="card audience-card" href="${pathFor(t.lang, "tours")}#${audienceAnchor[a.key]}">
        <span class="card-icon">${icon(audienceIcon[a.key])}</span>
        <span class="audience-title">${esc(a.title)}</span>
        <span class="audience-text">${esc(a.text)}</span>
        <span class="audience-more">${esc(h.audiencesLink)} ${icon("arrow")}</span>
      </a></li>`).join("")}
    </ul>
  </div>
</section>

${featuredQuote(t)}

<section class="section" aria-labelledby="themes-title">
  <div class="container">
    <h2 id="themes-title" class="section-title">${esc(h.themesTitle)}</h2>
    ${ornament}
    <p class="section-lead">${esc(h.themesLead)}</p>
    <div class="themes-grid">${themes.map((tour) => tourCard(t, tour, { compact: true })).join("")}</div>
  </div>
</section>

<section class="section gallery-dark" aria-labelledby="gallery-teaser-title">
  <div class="container">
    <h2 id="gallery-teaser-title" class="section-title">${esc(t.gallery.h1)}</h2>
    ${ornament}
    <p class="section-lead">${esc(t.gallery.lead)}</p>
    ${galleryGrid(t, 3)}
    <p class="center"><a class="text-link" href="${pathFor(t.lang, "gallery")}">${esc(t.gallery.homeLink)} ${icon("arrow")}</a></p>
  </div>
</section>

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
  return layout(t, "home", body);
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
  </div>
</section>`,
  )
  .join("\n")}
<section class="quote-band quote-band-white" aria-label="Voltaire">
  <div class="container">
    <blockquote lang="${t.lang}">
      <span class="quote-mark" aria-hidden="true">${QUOTES[t.lang][0].trim()}</span>
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
      <span class="quote-mark" aria-hidden="true">${QUOTES[t.lang][0].trim()}</span>
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
  title: p.title[t.lang] || p.title.fr,
  legend: p.legend[t.lang] || p.legend.fr || "",
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
<dialog class="lightbox" data-lightbox-dialog aria-label="${esc(g.h1)}">
  <figure><img alt=""><figcaption><strong></strong><span></span></figcaption></figure>
  <button type="button" class="lb-btn lb-close" data-lb="close" aria-label="${esc(g.close)}">${icon("close")}</button>
  <button type="button" class="lb-btn lb-prev" data-lb="prev" aria-label="${esc(g.prev)}">${icon("arrow")}</button>
  <button type="button" class="lb-btn lb-next" data-lb="next" aria-label="${esc(g.next)}">${icon("arrow")}</button>
</dialog>
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

export function aboutPage(t) {
  const a = t.about;
  const body = `
${pageHero(t, "about", a.h1, a.lead)}
<section class="section">
  <div class="container intro-grid">
    <figure class="portrait">${portraitSvg(a.portraitAlt)}</figure>
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
  <div class="container about-split">
    <div class="facts">
      <h2>${esc(a.factsTitle)}</h2>
      <ul class="checklist checklist-lg">${a.facts.map((f) => `<li>${icon("check")}${esc(f)}</li>`).join("")}</ul>
    </div>
    <blockquote class="pull-quote"><p>${quoted(t, a.quoteText)}</p><footer>— ${esc(site.guideName)}</footer></blockquote>
  </div>
</section>
${ctaBand(t, a.ctaTitle, a.ctaText)}`;
  return layout(t, "about", body);
}

export function practicalPage(t) {
  const p = t.practical;
  const accessIcons = ["car", "bus", "plane"];
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
<section class="section" aria-labelledby="dur-title">
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
  const tourTitles = Object.fromEntries(Object.keys(t.tours.items).map((id) => [id, t.tours.items[id].title]));
  const action = site.formEndpoint || `mailto:${site.email}`;
  const body = `
${pageHero(t, "contact", c.h1, c.lead)}
<section class="section" id="booking">
  <div class="container contact-grid">
    <form class="card booking-form" action="${esc(action)}" method="post"${site.formEndpoint ? "" : ' enctype="text/plain"'} novalidate data-booking-form
      data-endpoint="${esc(site.formEndpoint)}" data-email="${esc(site.email)}" data-subject="${esc(c.mailSubject)}"
      data-msg-success="${esc(c.success)}" data-msg-mailto="${esc(c.mailtoNotice)}" data-msg-error="${esc(c.error)}"
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
          <label for="f-size">${esc(f.groupSize)}</label>
          <input id="f-size" name="group_size" type="number" min="1" max="500" inputmode="numeric">
        </div>
        <div class="field">
          <label for="f-date">${esc(f.date)} ${req}</label>
          <input id="f-date" name="preferred_date" type="date" required>
        </div>
        <div class="field">
          <label for="f-lang">${esc(f.language)} ${req}</label>
          <select id="f-lang" name="tour_language" required>
            ${languages.map((l) => `<option value="${LANG_NAMES[l]}"${l === t.lang ? " selected" : ""}>${LANG_NAMES[l]}</option>`).join("")}
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
        <h2>${esc(c.directTitle)}</h2>
        <p>${esc(c.directText)}</p>
        <ul class="footer-contact contact-list">
          <li>${icon("mail")}<a href="mailto:${site.email}">${site.email}</a></li>
          <li>${icon("phone")}<a href="tel:${site.phoneHref}">${esc(site.phone)}</a></li>
          <li>${icon("globe")}<span>${esc(t.common.languagesSpoken)}</span></li>
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
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${FONTS_URL}">
  <link rel="stylesheet" href="/assets/styles.css?v=${ASSET_VERSION}">
</head>
<body>
<main class="section notfound">
  <div class="container narrow">
    <p class="eyebrow">404</p>
    <h1>${esc(t.notFound.title)}</h1>
    ${ornament}
    <p class="lead">${esc(t.notFound.text)}</p>
    <p class="btn-row btn-row-center">${languages.map((l) => `<a class="btn btn-outline btn-sm" href="/${l}/" lang="${l}">${esc(LANG_NAMES[l])}</a>`).join("")}</p>
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
  <meta name="theme-color" content="#1f2a44">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
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
    <p class="brand-mark brand-mark-lg" aria-hidden="true">S</p>
    <h1>Château de Voltaire · Ferney-Voltaire</h1>
    ${ornament}
    <ul class="root-langs">
      ${languages.map((l) => `<li><a class="btn btn-outline" href="/${l}/" lang="${l}" hreflang="${l}">${esc(LANG_NAMES[l])}<span>${esc(all[l].home.h1)}</span></a></li>`).join("")}
    </ul>
  </div>
</main>
</body>
</html>
`;
}
