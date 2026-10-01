// Site-wide settings. Edit these before going live — everything marked
// REPLACE is a placeholder that Sylvie must confirm.

export const site = {
  // Production origin, no trailing slash. Used for canonical, hreflang,
  // OpenGraph and the sitemap, which all need absolute URLs.
  origin: "https://www.sylvie-guide-voltaire.com", // REPLACE with the real domain

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

  address: {
    name: "Château de Voltaire",
    street: "Allée du Château",
    postalCode: "01210",
    locality: "Ferney-Voltaire",
    region: "Auvergne-Rhône-Alpes",
    country: "FR",
  },
};

export const languages = ["fr", "en", "de", "ru"];
export const defaultLanguage = "fr";

// Page keys → localized slugs. "" is the language home page.
export const pages = ["home", "tours", "about", "gallery", "practical", "contact"];

export const slugs = {
  fr: { home: "", tours: "visites", about: "a-propos", gallery: "galerie", practical: "infos-pratiques", contact: "contact" },
  en: { home: "", tours: "tours", about: "about", gallery: "gallery", practical: "practical-info", contact: "contact" },
  de: { home: "", tours: "fuehrungen", about: "ueber-mich", gallery: "galerie", practical: "praktische-infos", contact: "kontakt" },
  ru: { home: "", tours: "ekskursii", about: "obo-mne", gallery: "galereya", practical: "prakticheskaya-informatsiya", contact: "kontakty" },
};

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
