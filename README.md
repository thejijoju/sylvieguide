# Sylvie · Guide au Château de Voltaire

A multilingual (FR · EN · DE · RU) static website for Sylvie, an official guide at the
Château de Voltaire in Ferney-Voltaire. It is built to win group bookings (companies,
senior clubs, schools, tour operators) and individual tours.

`dist/` is the ready-to-deploy site, with no framework and no runtime dependencies.

**Hosting (Netlify, Cloudflare Pages or Vercel):** import this repository and set the
*build command* to `npm run build` and the *publish directory* to `dist`. Every change
pushed to GitHub, including photos uploaded from the web, then goes live automatically.

## Pages (×4 languages = 24 pages)

| Page | FR | EN | DE | RU |
|---|---|---|---|---|
| Home | `/fr/` | `/en/` | `/de/` | `/ru/` |
| Tours | `/fr/visites/` | `/en/tours/` | `/de/fuehrungen/` | `/ru/ekskursii/` |
| About | `/fr/a-propos/` | `/en/about/` | `/de/ueber-mich/` | `/ru/obo-mne/` |
| Gallery | `/fr/galerie/` | `/en/gallery/` | `/de/galerie/` | `/ru/galereya/` |
| Practical info | `/fr/infos-pratiques/` | `/en/practical-info/` | `/de/praktische-infos/` | `/ru/prakticheskaya-informatsiya/` |
| Contact / booking | `/fr/contact/` | `/en/contact/` | `/de/kontakt/` | `/ru/kontakty/` |

`/` sends visitors to their language: first their saved choice, then their browser language.
It also serves as the `x-default` language chooser.

## SEO built in

- A localized `<title>`, meta description and canonical on every page, each written around
  the target keywords (*visite guidée château de voltaire*, *private guide Ferney-Voltaire*,
  *Voltaire castle tour group*, *Führungen Schloss Voltaire*, *экскурсии в замок Вольтера Ферне*…).
- `hreflang` alternates for all four languages plus `x-default`, both in the pages and in `sitemap.xml`.
- OpenGraph and Twitter cards, with one 1200×630 image per language (`assets/og/og-*.png`)
  plus `og:locale` and its alternates, so links look right on LinkedIn, Facebook, WhatsApp and Telegram.
- JSON-LD structured data: `LocalBusiness`, `Person`, `TouristAttraction`, `WebPage` and
  `BreadcrumbList` on every page, an `ItemList` of `TouristTrip` on the tours page, and `FAQPage` on the practical info page.
- Semantic HTML: one `h1` per page, landmarks, breadcrumbs, and real `<details>` for the FAQ.
  It also includes a skip link and visible focus styles.
- Fast pages: no images to download (the château artwork is inline SVG), one CSS file and one
  small deferred JS file. Fonts load with `display=swap`.

## Before going live — checklist

All placeholders live in **`src/config.mjs`**:

1. `origin`: the real domain. Canonical, hreflang, OG and the sitemap all depend on it.
2. `email`, `phone`, `phoneHref`: Sylvie's real contact details.
3. `formEndpoint`: a form service URL that accepts JSON, for example Formspree
   (`https://formspree.io/f/xxxx`). If it is left empty, the form opens the visitor's mail app
   with the request pre-filled. That works, but a form service converts better.
4. Group sizes and durations in `tourCategories`, if Sylvie's offer differs.

Then check the copy in `src/i18n/*.mjs`:

- **The About page story and the quote are draft copy written in Sylvie's voice.** She should
  rewrite them in her own words and add real facts: years of experience, qualifications, a
  real testimonial. No testimonials were invented on purpose.
- Confirm the practical details with the monument: meeting points, parking, bus access and accessibility.
- **Gallery photos:** upload them to `src/assets/gallery/`. On GitHub you can do this
  from the web: open the folder, then *Add file → Upload files*. Every image there appears
  automatically on a black background, sorted by file name. Use descriptive names like
  `03-chateau-de-voltaire-charmilles.jpg`: the number sets the order and the words help image
  search. Give each photo a **title and a legend** in the four languages in
  `src/gallery.mjs`. The title becomes the alt text, and both show under the photo and in the
  full-screen view. Keep files under ~400 KB, about 2000 px. On the home page every photo appears in a
  horizontal filmstrip you can swipe or scroll with arrows; the gallery page shows them as a
  grid. Both open a photo full-screen with its legend. Photos are listed in the image
  sitemap and in `ImageGallery` structured data, and the first one is the gallery page's
  sharing image.
- **Video and portrait:** the home page plays Sylvie's welcome video (`src/assets/video/`,
  silent, 10 s, WebM + MP4, with a pause button; it stays still for visitors who reduce
  motion). It is described as a `VideoObject` and listed in the video sitemap. A still from it
  is Sylvie's portrait on the About page (`src/assets/img/`). For the hero, a wide photo of
  the château can replace the illustration: put an `<img>` inside `.hero-media` in
  `src/templates.mjs`.

**SEO check:** `npm run build && npm run seo` audits every page. It checks title and
description lengths, duplicates, a single `h1`, canonical and `hreflang` (all present and
pointing at real pages), Open Graph, image alt text and sizes, broken internal links, valid
JSON-LD, sitemap coverage and the target keywords. It fails on errors. Run it after every
change.

At launch, also fill in `sameAs` (Sylvie's profiles) and `verification` (Google Search
Console, Bing, Yandex codes) in `src/config.mjs`.

Finally, submit `https://<domain>/sitemap.xml` in Google Search Console and Yandex Webmaster.
Yandex matters for the Russian-speaking audience. Also create or claim a Google Business Profile.

## Editing & building

```bash
npm run build   # regenerates dist/ from src/ (Node 18+, no npm install needed)
npm run serve   # preview on http://localhost:8080
npm run og      # re-render the social images (needs Playwright + Chromium)
```

- `src/i18n/{fr,en,de,ru}.mjs`: all texts. The build fails if one language is missing a key that French has.
- `src/templates.mjs`: the page HTML, meta tags and structured data.
- `src/config.mjs`: business details, URL slugs and the tour catalogue.
- `src/assets/styles.css`, `src/assets/main.js`: design and progressive enhancements
  (mobile menu, remembered language, form validation and prefill).
- `src/gallery.mjs`: the gallery photo list.
- `src/art.mjs`: the SVG illustration, icons and favicon.

Re-run `npm run og` after changing headlines or the domain, so the social images stay in sync.
