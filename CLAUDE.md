# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

A plain static HTML/CSS/JS site for a handmade-goods shop — no framework, no build step,
no backend, no payment processing. Customers browse a product grid and order by messaging
the shop on Instagram. A separate (non-developer) person edits the content through a
browser-based CMS at `/admin/` (Sveltia CMS) that commits to this **public** repo — see
"Content & CMS" below; security rules there are hard requirements.

## Commands

The site itself has no build/lint step. To preview locally, serve the directory with any
static file server, e.g.:

```bash
python -m http.server 5500
```

(A `.claude/launch.json` config named `static-server` already does this for browser
previews in this tool.)

Automated tests (dev-only Node/Playwright tooling — does not affect the site itself):

```bash
npm install
npx playwright install chromium   # first time only
npm test                          # run all tests (Desktop + Mobile projects)
npx playwright test tests/data.spec.js   # run a single test file
npm run test:update-snapshots     # regenerate visual baselines after an intentional UI change
```

The Playwright config (`playwright.config.js`) serves the site via `npx http-server` on
port 5510 for tests — not Python's `http.server`, which drops connections under the
concurrent load Playwright's parallel workers generate (verified empirically; caused
flaky `ERR_CONNECTION_REFUSED` failures during test-suite setup).

## Architecture

- **Design** follows a reference mock-up the user supplied (Belfegor brand: centered
  header logo = `media/brand/logo.webp`, the user's emblem + wordmark artwork
  [`media/brand/logo-source.png`] cropped above its tagline, black background converted
  to transparency, exported at 3x display height; the "Handmade Jewelry" tagline under
  it stays HTML text so it's readable and translated. The footer still uses the text
  wordmark (`.site-title`), hero banner, category strip,
  framed cards with star accents, features strip, "Order through" footer). Keep new UI in
  that style: silver line-art SVG icons from `media/icons/`, used as CSS masks via
  `.icon` + `--icon` so they take `currentColor` (don't add per-color copies of icons).
- Five separate pages, each with its own copy of the header, `.features` strip and footer
  markup (no templating — plain static HTML, so shared chrome is hand-duplicated across
  files; `tests/sections.spec.js` asserts the copies are identical apart from
  `aria-current`). Footer links: Instagram, Telegram (`https://t.me/be11fegor` — double
  "1", as given by the user), Vinted.
  - `index.html` — Shop. Hero banner (headline, Shop Now → `#shop`, a product photo
    standing in for a future model shot, Kraków side column), `#category-filters`
    category strip, toolbar with `#filter-availability`/`#sort-select`, and an empty
    `#product-grid`. Loads `js/content.js`, `js/i18n.js`, then `js/main.js` (the only
    page that renders the grid). Its `<main>` carries an extra
    `section-shop` class so `.section-shop { max-width: none; }` can override the
    otherwise-shared `.section { max-width: 1300px; }` — the Shop page fills available
    width (matching the reference site) while About/Shipping stay narrower for
    readable text. Regression-guarded in `tests/shop.spec.js`.
  - `about.html` — About. Photo placeholder + bio text with bracketed placeholders like
    `[Your Name]` still to fill in.
  - `custom-orders.html` — Custom Orders: four process steps + Instagram CTA.
  - `shipping.html` — Shipping. Describes how orders ship (from Poland); bracketed
    placeholders like `[Carrier]`, `[A-B]` (business days) still to fill in.
  - `contact.html` — Contact: Instagram/Telegram/Vinted cards, location.
  - Every page's `<head>` links the favicon (`favicon.ico` [16+32px] and `favicon.png`
    [32x32], both scaled from the user's silver blackletter "B" artwork, 150x150
    source). There's no larger source, so no apple-touch-icon (180px would be upscaled).
  - Every page loads `js/content.js` then `js/i18n.js`. When adding a page, also add it to `PAGES` in
    `scripts/update-asset-versions.js` (drives CSS/JS versioning and several tests).
  - The nav on each page marks its own link with `aria-current="page"` by hand (styled via
    `.site-nav a[aria-current="page"]`) — when adding a page, replicate this pattern.
- **Content & CMS** — all editable content is JSON in `content/` (`products.json`,
  `categories.json`, `texts.json`, `site.json` = hero/about photos), fetched at runtime
  by `js/content.js` (`fetchContent`, with `cache: "no-cache"` so CMS edits show up
  promptly). The three translatable files are stored **per language at the top level**
  (`{en: {...}, ru: {...}, uk: {...}, pl: {...}}` — Sveltia's i18n `single_file`
  structure, required for the CMS's built-in Translate button, which the editor uses
  with a free Google Gemini key kept in their browser). `fetchLocalizedContent` runs
  `mergeLocales()` to turn them into the per-field shape the code reads
  (`texts.group.field = {en,ru,uk,pl}`, `product.name = {en,…}`); English defines the
  structure, and a value identical in every language (price, image path, category key,
  or a text like the brand name) stays a plain value — so consumers must go through
  `localize()` (and tests through `inLang()` in `tests/helpers.js`), never `.en`
  directly. In `admin/config.yml`, translated fields have `i18n: true`; the product and
  category lists have `i18n: duplicate` (same items in every language). `admin/config.yml` defines the
  editor's forms and **must mirror the JSON shapes exactly** (`tests/data.spec.js`
  compares them) — when you add a text/field, update the HTML, the JSON *and* the
  config. `EDITING.md` is the editor's guide; README "Editing content (CMS)" has setup
  and the security model. Hard rules (public repo):
  - Never commit secrets (tokens, OAuth client secrets). Sign-in is token-only
    (`auth_methods: [token]`); the token lives in the editor's browser.
  - Content is untrusted input: never insert it as HTML. `main.js` escapes every
    interpolated value with `escapeHtml`; `i18n.js` only sets `textContent`/attributes.
    Guarded by the injection tests in `tests/i18n.spec.js`.
  - The CMS script in `admin/index.html` stays pinned to an exact version with an SRI
    `integrity` hash (tested). Upgrade procedure is in README.
  - Image paths must be local `media/…` files. The CMS writes them with a leading slash
    (verified empirically — despite `public_folder: media/web`), which breaks on the
    GitHub Pages sub-path; `assetUrl()` in `js/content.js` strips it. Always pass
    content image paths through `assetUrl`.
  - Uploads are re-encoded by the CMS (`media_libraries.all.transformations`: WebP,
    ≤1600px), which strips EXIF incl. GPS — verified with a GPS-tagged test photo.
    Don't disable this.
  - Tests must read expected values from `content/*.json` (via `tests/helpers.js`),
    never hard-code current texts/products — CI (`.github/workflows/tests.yml`) runs on
    every CMS save, and a legitimate content edit must not fail it.
  - The Sveltia config schema is at
    `https://unpkg.com/@sveltia/cms@<version>/schema/sveltia-cms.json` — validate config
    changes against it (e.g. with ajv) rather than guessing keys; an early draft used
    `media_libraries.default` with options that belong under `media_libraries.all`.
- `js/i18n.js` — EN/RU/UA/PL switching (only the `.lang-select` dropdown in the header — the user had the extra RU/UA/PL/EN links in the Shop hero removed; persisted in `localStorage` with try/catch). Texts come from
  `content/texts.json`; HTML elements carry `data-i18n` / `data-i18n-aria-label`
  (`group.field`) with English inside as a pre-load fallback. `t(key, params)` for JS
  strings (with small `FALLBACK_TEXTS` if texts.json fails), `localize({en,…})` and
  `localizedProduct(p)`. Sets `<html data-texts-ready>` when done (main.js sets
  `data-shop-ready`); tests wait on these via `tests/helpers.js`. Fires a
  `languagechange` event that `main.js` uses to re-render the grid, category strip and
  an open modal.
- `media/goods_icons/` — original, full-resolution product photos (not referenced directly
  by the site). `media/web/` — compressed/resized copies (max 1000px, JPEG q78) that
  `content/products.json` points to, since raw phone photos are 1.6-6MB each and would make the
  page slow to load. Photos uploaded through the CMS land in `media/web/` already
  optimized (WebP); for photos added by hand, generate web copies with Pillow — see
  README.md.
- `js/main.js` — loads `content/products.json` + `categories.json` and renders one
  `.product-card` per item into `#product-grid` via the global `renderProducts(items)`
  (cards carry `data-index` into the last rendered list — there are no product ids for
  the editor to manage; price is a number, shown as `"<price> EUR"`) — a card is just an image, name,
  and price (plus a `.sold-out-badge` when relevant); there is no order button on the
  grid itself (just a decorative `.product-star`). Also defines `INSTAGRAM_URL`, used by the modal's Order link. Clicking a
  card (or focusing it and pressing Enter/Space) opens the `#product-modal` dialog
  (markup lives in `index.html`, hidden by default) via the global
  `openModal(product)`/`closeModal()` functions, showing the product's gallery image(s)
  (with a thumbnail row only when `images.length > 1`), description, price, and the
  Order link — ordering only happens from inside the modal. Closes via the close button,
  the backdrop, or Escape, and returns focus to the card that opened it.
  - **The modal image must stay dramatically bigger than the grid card image** — that's
    the whole point of a detail view. It's sized in viewport units (`min(800px, 60vw)`)
    so it actually scales with screen size rather than capping out at a fixed px value
    close to the card's own size (a real regression we hit once already). On narrow
    viewports (`max-width: 720px`) the modal goes fullscreen with a full-bleed image (no
    dialog padding) instead, since a fixed-padding centered dialog eats a much bigger
    fraction of a small screen — without that, the "detail" image was briefly *smaller*
    than the grid card on mobile. `tests/product-modal.spec.js` ("modal image is
    significantly larger...") asserts this directly: >1.4x the card width on viewports
    ≥600px, at least equal on narrower ones (where the card is already near full-width,
    so "much bigger" isn't geometrically possible).
  - **Any element with `filter` (`.product-image`/`.product-modal-image` used to have
    one; `.category-image` does now) creates a CSS stacking context that can paint above a sibling
    `position: absolute; z-index: auto` element**, even though plain positioning rules
    say it shouldn't — confirmed by reproducing it (the modal close button became
    unclickable, sitting under the image, only on narrow/fullscreen viewports where they
    visually overlap) and fixing it by removing the filter. Both `.product-modal-close`
    and `.sold-out-badge` now have an explicit `z-index` because of this. Any new control
    overlaid on a `.product-image`/`.product-modal-image` needs one too.
  - The "closing via the backdrop" test is skipped below 720px width: a fullscreen mobile
    sheet has no visible backdrop to tap by design (standard pattern — close via the
    button or Escape there instead), not a bug to fix.
  - **Shop filters/sort** (UI/UX pattern taken from
    [boldestudios.com/collections/the-shop](https://www.boldestudios.com/collections/the-shop),
    adapted — no cart/search/price-slider since we have no checkout and 5 products):
    `renderCategoryFilters(products)` builds the category-strip tiles (`.category-tile`,
    `aria-pressed`) for categories that have products, in `categories.json` order; clicking a tile makes it the single active
    category; the leading `.category-tile-all` tile (`data-category=""`, label
    `categories.all` in texts.json) clears it — added because users had no visible way
    back to all items. Clicking the active tile again also clears it. `applyFiltersAndSort()` reads the active
    category plus the `#filter-availability` and `#sort-select` dropdowns, filters+sorts
    a copy of `products`, and calls `renderProducts`. An empty result renders `.filter-empty` instead of a blank
    grid. A product with `soldOut: true` renders a `.sold-out-badge` over its card image
    (no button-level sold-out state on the card, since cards have no button); the
    modal's order control still shows a disabled `<span class="order-button is-disabled">`
    for a sold-out product.
- `css/style.css` — all styling: a dark/gothic/elegant theme (near-black background with a
  subtle grain texture, cool silver text/borders, blood-red accent — colors picked to
  match the jewelry photos themselves) and a responsive CSS grid
  (`repeat(auto-fill, minmax(...))`) for the product cards. Every page links it as
  `css/style.css?v=<hash>` — **after editing this file or any `js/*.js`, run
  `npm run assets:version`** (`scripts/update-asset-versions.js`; `css:version` is an
  alias) to update the hashes on all pages, or `npm test` will fail (`tests/data.spec.js`
  "asset cache-busting" group). JS needs it too: belfegor.shop is behind Cloudflare,
  which caches `.js`/`.css` (not `.html`/`.json`) — after the per-language content change
  it kept serving the old `main.js` with the new `products.json`, and the live shop
  rendered empty until the JS got versioned URLs. New local scripts must be added to
  `ASSETS` in that script (the test fails otherwise). Without a changing URL, browsers
  can keep serving an old cached copy of the CSS indefinitely — this is a real bug we hit
  (nav/section/about/shipping styles silently not applying for a visitor with a warm
  cache) and the version hash is the fix.
  - **Sticky footer**: `body` is a `min-height: 100vh` flex column and `.section` has
    `flex: 1 0 auto; width: 100%` (the `width` is needed — a flex item with
    `margin: 0 auto` would otherwise shrink to its content). Without this, short pages
    left the footer floating mid-screen on tall viewports. Every page's `<main>` must
    keep the `section` class; guarded by "footer sticks to the bottom" in
    `tests/sections.spec.js`.
  - **Form controls are fully custom-drawn** (`appearance: none` on `.lang-select` /
    `.filter-select`, with an SVG chevron) — native control rendering varies a lot across
    browsers/OSes (an earlier version's native-looking checkboxes rendered as plain
    oversized boxes for a real user while looking fine in this tool's Chromium preview).
    Never rely on `accent-color` or native styling alone for a themed look here.
  - **Every custom-colored `<a>` class must also style `:visited`** (e.g.
    `.order-button, .order-button:visited { color: ...; }`), because the browser's own
    `a:visited { color: purple; }` UA rule beats a plain class selector on specificity
    once a link has actually been visited. We hit this for real: the "Order via
    Instagram" links pointed to an Instagram profile that had genuinely been visited
    outside the site, so they silently rendered in the browser's default visited color
    instead of our silver/blood theme — invisible in Playwright, since every test runs in
    a fresh, history-less browser context where `:visited` never triggers, and even a
    script running inside a real browser can't detect it either (browsers deliberately
    hide the true `:visited` computed style to prevent history-sniffing). Guarded by the
    "visited-link color safety" group in `tests/data.spec.js`, which checks the CSS
    *source* for the required override — add any new link class to that test's list.
- `tests/` — Playwright test suite (`data.spec.js` data integrity, `shop.spec.js`
  Shop-page functional/layout checks incl. hero, `sections.spec.js` nav/footer/shared-chrome
  checks across all five pages + each page's content, `product-modal.spec.js` the
  click-to-view-details modal, `filters.spec.js` the category strip, Availability/Sort
  dropdowns, and sold-out rendering, `i18n.spec.js` language switching + content
  injection/robustness, `data.spec.js` content + CMS-config integrity and security,
  `visual.spec.js` screenshot regression for all five pages). See README.md
  for how to run them. `tests/visual.spec.js-snapshots/` holds the committed baseline
  images — regenerate with `npm run test:update-snapshots` after any intentional
  layout/content change.

There is intentionally no cart, checkout, or payment integration — ordering happens off-site
via Instagram DM, so the site only needs to display products and link out.

Hosting target: GitHub Pages (deploy from branch, root folder) — see README.md.

## Workflow rules

Do not hallucinate, verify things you are suggesting. If you can't be sure, say it plainly instead of imagining.
Always make autotests for the features you add/change.
When you face a bug, figure out what was is the root of the problem, then fix it and make sure similar will not happen again.
For complex tasks:
- Inspect existing examples first.
- Reuse established patterns.
- Compare proposed solutions against working implementations.
- Try to reuse and adapt existing solutions whenever possible.
- Iterate with user through tight feedback loops.
- Present a step-by-step plan or review before execution.
- List the files you intend to modify.
