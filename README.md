# Sylvie · Guide au Château de Voltaire

A multilingual (FR · EN · DE · RU) static website for Sylvie, an official guide at the
Château de Voltaire in Ferney-Voltaire. It is built to win group bookings (companies,
senior clubs, schools, tour operators) and individual tours.

`dist/` is the ready-to-deploy site, with no framework and no runtime dependencies.

**Hosting (Netlify, Cloudflare Pages or Vercel):** import this repository and set the
*build command* to `npm run build` and the *publish directory* to `dist`. Every change
pushed to GitHub, including photos uploaded from the web, then goes live automatically.

## Site structure (10 pages per language)

| Page | Focus | EN | FR |
|---|---|---|---|
| Home | Guided tours Château de Voltaire & Ferney-Voltaire, day trip from Geneva | `/en/` | `/fr/` |
| Tours | All tours, private tour of the Castle of Voltaire | `/en/tours/` | `/fr/visites/` |
| Group tours | Group booking, guided visits | `/en/group-tours/` | `/fr/visites-de-groupe/` |
| ↳ Corporate groups | Corporate outings, team building, incentives (MICE) | `/en/group-tours/corporate-groups/` | `/fr/visites-de-groupe/entreprises/` |
| ↳ Senior groups | Accessible senior visits, coach tours and parking | `/en/group-tours/senior-groups/` | `/fr/visites-de-groupe/seniors/` |
| Thematic tours | Enlightenment, Voltaire and Geneva, literary tours | `/en/thematic-tours/` | `/fr/visites-thematiques/` |
| About | Sylvie | `/en/about/` | `/fr/a-propos/` |
| Gallery | Photos | `/en/gallery/` | `/fr/galerie/` |
| Practical info | Prices, coach parking, access from GVA, Palexpo, TPG | `/en/practical-info/` | `/fr/infos-pratiques/` |
| Contact | Booking form | `/en/contact/` | `/fr/contact/` |

German and Russian have their own localized URLs (see `src/config.mjs`). Every other
language uses the English URLs under its own prefix (`/es/group-tours/…`).

## Languages

The site supports 16 languages: FR, EN, DE, RU, ES, IT, PT, NL, PL, UK, ZH, JA, KO, AR
(right-to-left), HI and TR. A language goes live as soon as its file `src/i18n/<code>.mjs`
exists. `node src/check-i18n.mjs <code>` verifies that a translation matches the English
structure exactly.

- **Header:** a flag dropdown with every language. **Footer:** all languages with flags.
  Flags come from [flag-icons](https://github.com/lipis/flag-icons) (MIT).
- **Browser language:** `/` sends visitors to their browser's language. On a first visit to
  any page, they are switched to their language's version of that page. A language chosen in
  the menu is remembered and always wins. Crawlers are never redirected, so every language
  stays indexable, and `?lang=keep` disables the switch for a link.
- **Tour languages:** Sylvie guides in FR, EN, DE and RU. The other translations say so;
  they don't promise tours in, say, Spanish.

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

**Access facts (confirmed by Sylvie's team, October 2026):** TPG bus lines 60 and 61 to
Ferney-Voltaire, coach parking on site, and 15 minutes from Geneva Airport (GVA) and
Palexpo. If any of these change, update them in `src/i18n/*.mjs` (all 16 languages).

**Visitor reviews:** add genuine reviews to `reviews.items` in each `src/i18n/*.mjs` (text,
author, rating). They show with stars on the home page and the Senior groups page. They
are deliberately not marked up as `Review`/`AggregateRating`: Google treats reviews a
business publishes about itself as self-serving. For stars in search results, collect
reviews on Google Business Profile.

**Search-result extras:** add starting prices in `site.prices` in `src/config.mjs`, and they
appear as offers in structured data. Review stars need real reviews (Google Business Profile,
TripAdvisor); never add invented ratings.


All placeholders live in **`src/config.mjs`**:

1. `origin`: **done: `https://www.guidevoltaire.com`** (domain at Namecheap, hosted on GitHub Pages).
2. `email`, `phone`: deliberately empty. Visitors contact Sylvie through the forms only.
3. `formEndpoint`: **set to FormSubmit** (`https://formsubmit.co/ajax/<address>`), which
   e-mails every request from the contact page to that address. The first request sent
   triggers a one-time activation e-mail from FormSubmit: click the link in it. FormSubmit
   then offers a random alias; put it in place of the address so the address is no longer
   in the page source. The e-mail lists name, email (reply goes straight to the visitor),
   group type, participants, thematic visit, date, tour language and message.
4. Prices are in `packages`; château admission (€7.50 group rate) and opening hours are in
   the translations (`practical.hours*`, `practical.admission*`) and in `CHATEAU_HOURS`
   (templates.mjs) for structured data.
5. Group sizes and durations in `tourCategories`, if Sylvie's offer differs.

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
- **Videos and portrait:** two silent looping clips of Sylvie (`src/assets/video/`, WebM + MP4,
  listed in `VIDEOS` in `src/templates.mjs`):
  - **Welcome** (home page, 10 s): she opens the château door.
  - **Park** (About page, 23 s): she leads visitors to the front steps.

  Each plays only while on screen, has a pause button, and stays still for visitors who
  reduce motion. Both are described as `VideoObject` and listed in the video sitemap in all
  languages. Sylvie's portrait in front of the château is the About-page photo and sharing
  image (`src/assets/img/`).

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
