# Belfegor — Handmade Jewelry

A simple static website for a handmade-goods shop. No backend, no build step, no payment
processing — customers browse a grid of products and order by messaging the shop on
Instagram.

## Structure

Five pages, sharing the same header, features strip and footer markup (hand-duplicated —
no templating):

- `index.html` — Shop (hero banner, category strip, product grid)
- `about.html` — About Me
- `custom-orders.html` — Custom Orders (how commissions work)
- `shipping.html` — Shipping info
- `contact.html` — Contact (Instagram / Telegram / Vinted)
- `css/style.css` — all styling
- `js/data.js` — the product catalog (edit this to add/remove/change products)
- `js/main.js` — renders the product grid from `data.js` (only loaded on `index.html`)
- `js/i18n.js` — the EN/RU/UA/PL language switcher and translations (loaded on every page)
- `media/icons/` — line-art SVG icons (logo ornament, stars, feature and social icons)

The design follows a reference mock-up: dark gothic theme, "Belfegor" blackletter logo
with an antler/star ornament, silver line-art icons, blood-red accents.

Adding a new page: copy an existing page's header, features strip and footer, mark the
new link with `aria-current="page"` on its own page, and add the link to every other
page's nav too. `tests/sections.spec.js` fails if the shared markup differs between pages.
Also add the page to `PAGES` in `scripts/update-css-version.js`.

## Languages

`js/i18n.js` switches between English, Russian, Ukrainian and Polish (header dropdown, or
the RU / UA / PL / EN links in the Shop hero). The choice is remembered in
`localStorage`; first-time visitors get their browser language if it's one of the four.

- English page text lives in the HTML. Tag an element with `data-i18n="some.key"` (or
  `data-i18n-aria-label="some.key"` for an aria-label) and add `some.key` to the `ru`,
  `uk` and `pl` dictionaries in `js/i18n.js`.
- Strings rendered by JS (cards, modal, filters) need an `en` entry too.
- Products are translated via an optional `translations` field in `js/data.js` (see below).
- Category labels are `category.<Category>` keys (plural, e.g. "Necklaces").

`tests/i18n.spec.js` fails if any key or product is missing a translation. The RU/UA/PL
texts were machine-written; have a native speaker proofread them.

## Adding or editing products

Open `js/data.js` and edit the `products` array. Each product needs:

```js
{
  id: 7,
  name: "Product Name",
  price: "20 EUR",
  image: "media/web/your-photo.jpg",       // grid thumbnail
  images: ["media/web/your-photo.jpg"],    // gallery shown in the detail modal; add more
                                            // entries for a multi-photo product and a
                                            // thumbnail row appears automatically
  description: "A short description of the piece.",
  category: "Necklace",                    // gets a tile in the category strip automatically —
                                            // reuse an existing category or introduce a new one
                                            // (and add a `category.<Name>` label in js/i18n.js)
  soldOut: false,                          // true shows a "SOLD OUT" badge and disables ordering
  translations: {                          // optional; falls back to English
    ru: { name: "...", description: "..." },
    uk: { name: "...", description: "..." },
    pl: { name: "...", description: "..." },
  },
}
```

## Shop filters and sorting

Below the hero, a category strip has one tile per distinct `category` in `js/data.js`,
using that category's first product photo as its picture, so adding a product with a new
category needs no HTML changes. Clicking a tile shows only that category, and clicking it
again shows everything. Above the grid, an Availability dropdown (All / In stock / Sold
out) and a Sort dropdown refine the list. Marking a product `soldOut: true` shows a
"SOLD OUT" badge on its card, disables the modal's order control, and puts it under
"Sold out".

## Shop layout width

Every page shares `.section { max-width: 1300px; }`, which keeps About/Shipping's text
readable. The Shop page's `<main>` additionally has a `section-shop` class so
`.section-shop { max-width: none; }` overrides that cap — the toolbar and product
grid expand to fill available width on wide screens (matching the reference site) instead
of leaving large empty margins either side, and the grid's `repeat(auto-fill, minmax(...))`
naturally adds more columns as space allows.

## Product detail modal

Clicking a product card (or focusing it and pressing Enter/Space) opens a modal with the
larger photo(s), description, and price — see `#product-modal` in `index.html` and the
`openModal`/`closeModal` functions in `js/main.js`. Closes via its close button, the
backdrop (viewports ≥720px only — see below), or Escape. No extra setup needed: it's
driven entirely by each product's `images`/`description` fields in `js/data.js`.

**The modal photo is sized in viewport units** (`min(800px, 60vw)`) specifically so it
stays dramatically bigger than the grid card image on any screen size — a fixed pixel
cap close to the card's own size defeats the point of a detail view. On narrow screens
(`max-width: 720px`) the modal goes fullscreen with a full-bleed image instead of a
padded centered dialog, since fixed padding eats a much bigger fraction of a small
screen (without this, the image was briefly *smaller* on mobile than in the grid).
Fullscreen means there's no visible backdrop to tap there — closing works via the button
or Escape only, the standard pattern for fullscreen mobile sheets.

If you add a control that overlays `.product-image` or `.product-modal-image`, give it
an explicit `z-index`: images have had a `filter` (and may again), which creates a CSS
stacking context that can paint above a plain
`position: absolute; z-index: auto` sibling — this actually broke the close button on
mobile once (see `.product-modal-close` and `.sold-out-badge` in `css/style.css` for the
fix).

## Editing the About page

`about.html` (and the `about.bio` translations in `js/i18n.js`) has placeholder bio text (`[Your Name]`, `[X years]`, `[Your City]`) —
replace these with the real details. The `.about-photo` box is a styled placeholder; swap
it for a real `<img>` (optimized the same way as product photos, see below) once a photo
is ready.

## Editing the Shipping page

`shipping.html` (and the `shipping.*` translations in `js/i18n.js`) has placeholder shipping specifics (`[City]`, `[Carrier]`, `[X]` business
days, `[A-B]`/`[C-D]` timeframes) — replace these with the real details. "Poland" is
already filled in as the ship-from country.

### Adding product photos

Original, full-resolution photos live in `media/goods_icons/`. Before referencing a new
photo from `js/data.js`, create a compressed web copy in `media/web/` (max 1000px on the
long edge, JPEG quality ~78) so the page stays fast to load — a phone photo can easily be
20-50x larger than needed for a product-grid thumbnail. Use `Pillow` for this, e.g.:

```python
from PIL import Image, ImageOps
img = ImageOps.exif_transpose(Image.open("media/goods_icons/your-photo.jpeg")).convert("RGB")
img.thumbnail((1000, 1000))
img.save("media/web/your-photo.jpg", "JPEG", quality=78, optimize=True)
```

## Running locally

This is a plain static site, so any static file server works, e.g.:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Editing CSS

After editing `css/style.css`, run:

```bash
npm run css:version
```

This stamps a content-hash query string (`css/style.css?v=<hash>`) onto the stylesheet
link in every page. Without it, a visitor's (or your own) browser can keep serving an old
cached copy of the CSS indefinitely, since the URL never otherwise changes — this
actually happened during development (nav/section/about/shipping styles silently didn't
apply for a real visitor while looking fine for anyone with a fresh cache). `npm test`
fails if a page's version doesn't match the CSS file's current content hash, so forgetting
this step is caught automatically rather than shipping a stale-looking site.

## Link colors and `:visited`

Any `<a>` given a custom `color` must also get a matching `:visited` rule, e.g.:

```css
.your-link,
.your-link:visited {
  color: var(--color-silver);
}
```

Browsers apply their own `a:visited { color: purple; }` rule, which beats a plain class
selector once a link has actually been visited — this bit us for real on the "Order via
Instagram" buttons/links, which silently reverted to the browser's default visited color
for anyone who had genuinely visited that Instagram profile before. It's invisible in
both Playwright (fresh, history-less browser each run) and even manual devtools
inspection (browsers hide the true `:visited` computed style from scripts on purpose).
`npm test` catches a missing override via a source-level check
(`tests/data.spec.js`, "visited-link color safety") — add any new custom-colored link
class to that test.

## Testing

Automated tests use [Playwright](https://playwright.dev), run against Desktop (1280x800)
and Mobile (Pixel 5) viewports. This is dev-only tooling — the site itself has no build
step or dependency on Node.

```bash
npm install
npx playwright install chromium   # first time only
npm test
```

- `tests/data.spec.js` — validates `js/data.js` (unique ids, well-formed price/fields,
  non-empty description/category, `soldOut` is a boolean, every referenced image/gallery
  image actually exists on disk, every product translation is non-empty) and checks all
  pages for leftover placeholder text
  (e.g. a forgotten `your_instagram`).
- `tests/shop.spec.js` — loads the Shop page and checks: the grid renders exactly one
  card per product, every card has an image/name/price and no order button (ordering only
  happens in the detail modal), no image fails to load, no request returns an error
  status, the grid is geometrically uniform (equal-width cards, single column on narrow
  viewports, multiple columns on wide ones, no horizontal overflow), the price sits at
  the same offset in every card regardless of product name length, and the Shop layout
  expands past the page-wide 1300px cap on wide viewports instead of leaving large empty
  margins (see "Shop layout width" below).
- `tests/product-modal.spec.js` — the click-to-view-details modal: opens with the right
  product's photo/name/description/price/Instagram link, is significantly larger than the
  grid card image (the whole point of a detail view — see "The modal photo" below),
  replaces its content correctly across opens, closes via the close button/Escape and
  returns focus to the triggering card (backdrop too, on viewports ≥720px wide — the
  modal is intentionally fullscreen with no backdrop below that), keyboard-openable
  (Enter on a focused card), clicking the modal's own Order button does not close the
  modal, single-image products show no thumbnail row, and multi-image products show
  thumbnails that switch the main photo.
- `tests/filters.spec.js` — the category strip and Availability/Sort dropdowns: a tile
  exists for every distinct category (with a loading image), clicking a tile filters to
  that category and clicking it again restores everything, the availability dropdown
  hides the right products, each sort option orders cards correctly (price asc/desc, name A-Z),
  "Most relevant" restores the original catalog order, filtering out everything shows an
  empty-state message, and a sold-out product shows its badge on the card and a disabled
  order control in the modal, while an in-stock product shows neither.
- `tests/sections.spec.js` — for each of the 5 pages: checks the nav has all 5 links in
  order, exactly the current page is marked `aria-current="page"`, the logo links home,
  the footer Instagram/Telegram/Vinted links work, the features strip is present, the
  page never scrolls horizontally, and each nav link navigates. Also checks the shared
  header/features/footer markup is identical across pages, every icon referenced in the
  CSS exists, and each page's own content.
- `tests/i18n.spec.js` — every translation key used in the HTML/JS exists in RU/UA/PL,
  every product and category is translated, switching language updates static text,
  products, title and an open modal, switching back restores English, the choice
  persists across pages, and filters still work afterwards.
- `tests/visual.spec.js` — full-page screenshot comparison for all five pages against a
  committed baseline (`tests/visual.spec.js-snapshots/`), to catch unintended visual
  changes. Screenshots are OS-dependent (font rendering differs across platforms) — if you
  run this on a different OS than the baseline was generated on, regenerate it there with
  `npm run test:update-snapshots` rather than treating a mismatch as a real bug.
- `tests/data.spec.js`'s "css cache-busting" group — checks that every page's stylesheet
  link version matches `css/style.css`'s current content hash (see "Editing CSS" above).
- `tests/data.spec.js`'s "visited-link color safety" group — checks that every
  custom-colored link class has a matching `:visited` rule in `css/style.css` (see
  "Link colors and `:visited`" above).

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch".
4. Choose the `master` branch and `/ (root)` folder, then save.
5. GitHub will publish the site at `https://<username>.github.io/<repo-name>/`.
