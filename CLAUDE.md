# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

A plain static HTML/CSS/JS site for a handmade-goods shop — no framework, no build step,
no backend, no payment processing. Customers browse a product grid and order by messaging
the shop on Instagram.

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

- Three separate pages, each with its own copy of the header/nav/footer markup (no
  templating — plain static HTML, so shared chrome is hand-duplicated across files):
  - `index.html` — Shop. Header (shop name, Instagram link, nav), an empty
    `#product-grid` container. Loads `js/data.js` then `js/main.js` (the only page that
    does — it's the only one that renders the grid). Its `<main>` carries an extra
    `section-shop` class so `.section-shop { max-width: none; }` can override the
    otherwise-shared `.section { max-width: 1300px; }` — the Shop page fills available
    width (matching the reference site) while About/Shipping stay narrower for
    readable text. Regression-guarded in `tests/shop.spec.js`.
  - `about.html` — About. Photo placeholder + bio text with bracketed placeholders like
    `[Your Name]` still to fill in.
  - `shipping.html` — Shipping. Describes how orders ship (from Poland); bracketed
    placeholders like `[Carrier]`, `[A-B]` (business days) still to fill in.
  - The nav on each page marks its own link with `aria-current="page"` by hand (styled via
    `.site-nav a[aria-current="page"]`) — when adding a page, replicate this pattern.
- `js/data.js` — the product catalog as a plain `products` array (id, name, price,
  `image` [grid thumbnail], `images` [gallery array for the modal — currently one entry
  per product, but the modal supports more], `description`, `category` [drives the Shop
  page's category filter — a checkbox is generated per distinct value found in the data,
  so adding a new category needs no HTML changes], `soldOut` [boolean — drives the
  "Availability" filter, the SOLD OUT badge, and disabling the order control]). This is
  the only file that needs editing to add/remove/change products.
- `media/goods_icons/` — original, full-resolution product photos (not referenced directly
  by the site). `media/web/` — compressed/resized copies (max 1000px, JPEG q78) that
  `data.js` actually points to, since raw phone photos are 1.6-6MB each and would make the
  page slow to load. Generate new web copies with Pillow before adding a product photo —
  see README.md.
- `js/main.js` — reads `products` and renders one `.product-card` per item into
  `#product-grid` via the global `renderProducts(items)` — a card is just an image, name,
  and price (plus a `.sold-out-badge` when relevant); there is no order button on the
  grid itself. Also defines `INSTAGRAM_URL`, used by the modal's Order link. Clicking a
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
  - **Any element with `filter` (both `.product-image` and `.product-modal-image` have
    one) creates a CSS stacking context that can paint above a sibling
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
    `renderCategoryFilters(products)` builds the Category checkbox list from whatever
    distinct `category` values exist in the data (so it can't drift out of sync with
    `data.js`); `applyFiltersAndSort()` reads the checked Availability/Category
    checkboxes and the selected Sort radio, filters+sorts a copy of `products`, and calls
    `renderProducts`. Every filter/sort input has a `change` listener wired to
    `applyFiltersAndSort`. An empty result renders `.filter-empty` instead of a blank
    grid. A product with `soldOut: true` renders a `.sold-out-badge` over its card image
    (no button-level sold-out state on the card, since cards have no button); the
    modal's order control still shows a disabled `<span class="order-button is-disabled">`
    for a sold-out product.
- `css/style.css` — all styling: a dark/gothic/elegant theme (near-black background with a
  subtle grain texture, cool silver text/borders, blood-red accent — colors picked to
  match the jewelry photos themselves) and a responsive CSS grid
  (`repeat(auto-fill, minmax(...))`) for the product cards. Every page links it as
  `css/style.css?v=<hash>` — **after editing this file, run `npm run css:version`**
  (`scripts/update-css-version.js`) to update that hash on all pages, or `npm test` will
  fail (`tests/data.spec.js` "css cache-busting" group). Without a changing URL, browsers
  can keep serving an old cached copy of the CSS indefinitely — this is a real bug we hit
  (nav/section/about/shipping styles silently not applying for a visitor with a warm
  cache) and the version hash is the fix.
  - **Filter checkboxes/radios are fully custom-drawn** (`appearance: none` +
    `::after` fill), not native inputs with just `accent-color` — native checkbox/radio
    rendering (size, shape, whether `accent-color` is even honored) varies a lot across
    browsers/OSes, so relying on it looked fine in this tool's Chromium preview but
    rendered as plain oversized native checkboxes for a real user. Never rely on
    `accent-color` alone for a themed look here.
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
  Shop-page functional/layout checks, `sections.spec.js` nav + About/Shipping page checks
  across all three pages, `product-modal.spec.js` the click-to-view-details modal,
  `filters.spec.js` the Category/Availability filters, Sort control, and sold-out
  rendering, `visual.spec.js` screenshot regression for all three pages). See README.md
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
