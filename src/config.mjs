import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Site-wide settings. Edit these before going live — everything marked
// REPLACE is a placeholder that Sylvie must confirm.

export const site = {
  // Production origin, no trailing slash. Used for canonical, hreflang,
  // OpenGraph and the sitemap, which all need absolute URLs.
  origin: "https://www.guidevoltaire.com",

  brand: "Sylvie · Guide Château de Voltaire",
  guideName: "Sylvie",

  email: "contact@sylvie-guide-voltaire.com", // REPLACE
  phone: "+33 6 00 00 00 00", // REPLACE (displayed)
  phoneHref: "+33600000000", // REPLACE (tel: link)

  // Where the booking form is POSTed (Formspree, Basin, Getform, your own
  // endpoint…). It must accept a JSON body. Leave empty and the form falls
  // back to opening the visitor's e-mail client with the request pre-filled.
  formEndpoint: "",

  // Profiles that belong to Sylvie (Instagram, Facebook, LinkedIn,
  // TripAdvisor, Google Business Profile…). Search engines use them to tie
  // the site to her. Full URLs.
  sameAs: [],

  // Ownership codes from each search engine's webmaster tools (only the
  // content="…" value). Leave empty until you have them.
  verification: { google: "", bing: "", yandex: "" },

  // Optional starting prices (guiding fee) for structured data, e.g.
  // { group: { from: 180 }, corporate: { from: 250 }, seniors: { from: 180 },
  //   thematic: { from: 200 } }. Leave empty until Sylvie confirms prices.
  currency: "EUR",
  prices: {},

  address: {
    name: "Château de Voltaire",
    street: "Allée du Château",
    postalCode: "01210",
    locality: "Ferney-Voltaire",
    region: "Auvergne-Rhône-Alpes",
    country: "FR",
  },
};

// Every language the site can be published in. A language goes live as soon
// as its translation file src/i18n/<code>.mjs exists. `flag` names a file in
// src/assets/flags/ (flag-icons, MIT); `font` adds a Google font for scripts
// that Montserrat/Inter do not cover.
export const langMeta = {
  fr: { name: "Français", flag: "fr", locale: "fr_FR" },
  en: { name: "English", flag: "gb", locale: "en_GB" },
  de: { name: "Deutsch", flag: "de", locale: "de_DE" },
  ru: { name: "Русский", flag: "ru", locale: "ru_RU" },
  es: { name: "Español", flag: "es", locale: "es_ES" },
  it: { name: "Italiano", flag: "it", locale: "it_IT" },
  pt: { name: "Português", flag: "pt", locale: "pt_PT" },
  nl: { name: "Nederlands", flag: "nl", locale: "nl_NL" },
  pl: { name: "Polski", flag: "pl", locale: "pl_PL" },
  uk: { name: "Українська", flag: "ua", locale: "uk_UA" },
  zh: { name: "中文", flag: "cn", locale: "zh_CN", font: "Noto+Sans+SC:wght@400;500;700" },
  ja: { name: "日本語", flag: "jp", locale: "ja_JP", font: "Noto+Sans+JP:wght@400;500;700" },
  ko: { name: "한국어", flag: "kr", locale: "ko_KR", font: "Noto+Sans+KR:wght@400;500;700" },
  ar: { name: "العربية", flag: "arab", locale: "ar_AR", dir: "rtl", font: "Noto+Sans+Arabic:wght@400;500;700" },
  hi: { name: "हिन्दी", flag: "in", locale: "hi_IN", font: "Noto+Sans+Devanagari:wght@400;500;700" },
  tr: { name: "Türkçe", flag: "tr", locale: "tr_TR" },
};

const i18nDir = join(dirname(fileURLToPath(import.meta.url)), "i18n");
export const languages = Object.keys(langMeta).filter((l) => existsSync(join(i18nDir, `${l}.mjs`)));
export const defaultLanguage = "fr";

// Languages Sylvie guides in (the booking form offers these).
export const tourLanguages = ["fr", "en", "de", "ru"];

// Page keys → localized slugs. "" is the language home page. A slug may
// contain "/" for sub-pages; `parents` sets their breadcrumb parent.
export const pages = ["home", "tours", "group", "corporate", "seniors", "thematic", "about", "gallery", "practical", "contact"];
export const parents = { corporate: "group", seniors: "group" };
export const headerPages = ["tours", "group", "thematic", "about", "gallery", "practical"];

const enSlugs = { home: "", tours: "tours", group: "group-tours", corporate: "group-tours/corporate-groups", seniors: "group-tours/senior-groups", thematic: "thematic-tours", about: "about", gallery: "gallery", practical: "practical-info", contact: "contact" };
const localSlugs = {
  fr: { home: "", tours: "visites", group: "visites-de-groupe", corporate: "visites-de-groupe/entreprises", seniors: "visites-de-groupe/seniors", thematic: "visites-thematiques", about: "a-propos", gallery: "galerie", practical: "infos-pratiques", contact: "contact" },
  en: enSlugs,
  de: { home: "", tours: "fuehrungen", group: "gruppenfuehrungen", corporate: "gruppenfuehrungen/firmen", seniors: "gruppenfuehrungen/senioren", thematic: "themenfuehrungen", about: "ueber-mich", gallery: "galerie", practical: "praktische-infos", contact: "kontakt" },
  ru: { home: "", tours: "ekskursii", group: "gruppovye-ekskursii", corporate: "gruppovye-ekskursii/kompanii", seniors: "gruppovye-ekskursii/starshee-pokolenie", thematic: "tematicheskie-ekskursii", about: "obo-mne", gallery: "galereya", practical: "prakticheskaya-informatsiya", contact: "kontakty" },
};
// Other languages use the English slugs.
export const slugs = Object.fromEntries(Object.keys(langMeta).map((l) => [l, localSlugs[l] || enSlugs]));

// Tour catalogue structure shared by every language. Texts live in i18n/*.
// duration is in minutes; group sizes are indicative and can be edited here.
export const tourCategories = [
  { id: "individual", tours: [
    { id: "classic", duration: 60, size: [1, 12], icon: "key" },
    { id: "private", duration: 75, size: [1, 8], icon: "quill" },
  ]},
  { id: "groups", tours: [
    { id: "discovery", duration: 90, size: [10, 30], icon: "columns" },
    { id: "town", duration: 120, size: [10, 30], icon: "map" },
  ]},
  { id: "thematic", tours: [
    { id: "enlightenment", duration: 90, size: [8, 30], icon: "book" },
    { id: "chateau-life", duration: 90, size: [8, 30], icon: "candle" },
    { id: "gardens", duration: 75, size: [8, 30], icon: "leaf" },
  ]},
  { id: "special", tours: [
    { id: "corporate", duration: 120, size: [8, 60], icon: "handshake" },
    { id: "seniors", duration: 75, size: [6, 30], icon: "bench" },
    { id: "schools", duration: 75, size: [10, 35], icon: "pupil" },
  ]},
];

// Values offered by the "group type" select on the booking form.
export const groupTypes = ["individual", "private", "corporate", "school", "seniors", "tourist"];
