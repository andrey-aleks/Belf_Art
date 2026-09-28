# Belfegor — Handmade Jewelry

A simple static website for a handmade-goods shop. No backend, no build step, no payment
processing — customers browse a grid of products and order by messaging the shop on
Instagram.

## Structure

Five pages, sharing the same header, features strip and footer markup (hand-duplicated —
no templating). Their texts, products and photos are loaded from `content/*.json` (see
"Editing content (CMS)"):

- `index.html` — Shop (hero banner, category strip, product grid)
- `about.html` — About Me
- `custom-orders.html` — Custom Orders (how commissions work)
- `shipping.html` — Shipping info
- `contact.html` — Contact (Instagram / Telegram / Vinted)
- `css/style.css` — all styling
- `content/` — all editable content (products, categories, page texts, page photos)
- `admin/` — the browser-based content editor (Sveltia CMS)
- `js/content.js` — loads `content/*.json`; sets the page photos
- `js/main.js` — renders the product grid (only loaded on `index.html`)
- `js/i18n.js` — the EN/RU/UA/PL language switcher; applies `content/texts.json`
- `media/icons/` — line-art SVG icons (logo ornament, stars, feature and social icons)

The design follows a reference mock-up: dark gothic theme, "Belfegor" blackletter logo
with an antler/star ornament, silver line-art icons, blood-red accents.

Adding a new page: copy an existing page's header, features strip and footer, mark the
new link with `aria-current="page"` on its own page, and add the link to every other
page's nav too. `tests/sections.spec.js` fails if the shared markup differs between pages.
Also add the page to `PAGES` in `scripts/update-css-version.js`.

## Languages

The header dropdown (and the RU / UA / PL / EN links in the Shop hero) switch between
English, Russian, Ukrainian and Polish. The choice is remembered in `localStorage`;
first-time visitors get their browser language if it's one of the four. All texts come
from `content/texts.json`, product names/descriptions and category labels from their own
JSON files — see below. A missing translation falls back to English, but the tests
require every language to be filled in. The RU/UA/PL texts were machine-written; have a
native speaker proofread them.

## Editing content (CMS)

Products, categories, every page text (in all four languages) and the page photos live
in JSON files under `content/`, and a non-developer edits them in the browser through
[Sveltia CMS](https://github.com/sveltia/sveltia-cms) at **`/admin/`** — no repo
download needed. Each save is a commit to `master`; GitHub Pages redeploys in ~1–2 min.
**The editor's guide is [EDITING.md](EDITING.md)** — send it to them.

| File | Contents |
|---|---|
| `content/products.json` | `products[]`: `name`/`description` as `{en, ru, uk, pl}`, `price` (number, EUR), `category` (a key from categories.json), `soldOut`, `images[]` (first = grid photo) |
| `content/categories.json` | `categories[]`: `key` + `label {en, ru, uk, pl}`; tile order on the Shop page |
| `content/texts.json` | `{ group: { field: { en, ru, uk, pl } } }` — referenced from HTML as `data-i18n="group.field"` |
| `content/site.json` | `heroImage`, `aboutPhoto` (empty = placeholder) |
| `admin/config.yml` | the editor's forms; must mirror the JSON shapes (enforced by `tests/data.spec.js`) |
| `admin/index.html` | loads the CMS from unpkg, pinned + Subresource Integrity |

You can edit the JSON by hand too. Adding a new text: put `data-i18n="group.field"` on
the element (keep English inside it as a pre-load fallback), add the entry to
`content/texts.json`, and add a matching field to the `texts` file in
`admin/config.yml` — the tests fail until all three agree.

### Setting up an editor (one-time, for the repo owner)

1. **Settings → Collaborators → Add people** → their GitHub username (role: Write).
2. Send them [EDITING.md](EDITING.md). They create a *classic* token with the `repo`
   scope: GitHub's fine-grained tokens can't be used by a collaborator on a repository
   owned by another personal account
   ([GitHub docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)).
   A classic `repo` token reaches every repo the account can access, which is why the
   guide recommends a dedicated GitHub account used only for this shop.
3. To revoke access: remove them from Collaborators — their token then stops working
   for this repo immediately.

### Security model (the repo is public)

- **No secrets anywhere in the repo.** Sign-in is by the editor's own token, pasted
  into the CMS and kept in *their* browser's local storage. There's no OAuth app or
  client secret (`auth_methods: [token]`). Tests fail if config.yml contains
  token-/secret-looking values.
- **`/admin/` is public but powerless**: without a token that has write access to this
  repo, nobody can save. It's `noindex` for search engines.
- **The CMS script is pinned** (`@sveltia/cms@<version>` + `integrity="sha384-…"`), so a
  compromised or changed CDN file is refused by the browser instead of running on the
  page that holds the token.
- **Content is never rendered as HTML.** `js/main.js` escapes every value it puts into a
  template (`escapeHtml`), and `js/i18n.js` only sets `textContent`. Tested with an
  injection payload in `tests/i18n.spec.js`.
- **Only local images**: tests reject image paths that aren't `media/…` files in the repo.
- **Photos are cleaned on upload**: resized to ≤1600px, WebP, EXIF (incl. GPS location)
  stripped — verified with a GPS-tagged test photo.
- **Everything committed is public forever**, including history. EDITING.md warns the
  editor and asks them to hide their email in commits.
- **CI** (`.github/workflows/tests.yml`) runs with a read-only token, never on
  `pull_request_target`, and uses actions pinned to commit SHAs.

Known gaps / trade-offs:
- GitHub emails a failed check to **whoever pushed** — i.e. the editor, not you. Check
  the repo's commit list or Actions tab for red ✗ marks.
- Pages deploys from the branch regardless of the checks, so a broken edit goes live
  until fixed/reverted. Stricter option: switch **Settings → Pages → Source** to
  "GitHub Actions" and deploy only after tests pass.
- The CMS writes image paths with a leading slash (`/media/web/x.webp`), which on the
  `…github.io/Belf_Art/` sub-path would point outside the site. `assetUrl()` in
  `js/content.js` strips it; covered by tests.
- The English inside the HTML is only a fallback; after the editor changes a text, the
  HTML copy goes stale (visible for a split second before texts.json loads, and to
  crawlers that don't run JS).

### Updating the CMS

Bump the version in `admin/index.html` and recompute the hash:

```bash
curl -sL https://unpkg.com/@sveltia/cms@<version>/dist/sveltia-cms.js | openssl dgst -sha384 -binary | openssl base64 -A
```

Then open `/admin/` locally, choose **Work with Local Repository**, and check editing
still works before committing.

## Shop filters and sorting

Below the hero, a category strip has one tile per category from
`content/categories.json` that has at least one product (in that file's order), using the
category's first product photo as its picture. Clicking a tile shows only that category, and clicking it
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
driven entirely by each product's `images`/`description` fields in `content/products.json`.

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

The About bio (`about.bio` in `content/texts.json`, editable in the CMS) has placeholder text (`[Your Name]`, `[X years]`, `[Your City]`) —
replace these with the real details. The `.about-photo` box is a styled placeholder; swap
it for a real `<img>` (optimized the same way as product photos, see below) once a photo
is ready.

## Editing the Shipping page

The Shipping texts (`shipping.*` in `content/texts.json`) have placeholder shipping specifics (`[City]`, `[Carrier]`, `[X]` business
days, `[A-B]`/`[C-D]` timeframes) — replace these with the real details. "Poland" is
already filled in as the ship-from country.

### Adding product photos

Photos uploaded through the CMS are resized and converted automatically. For photos
added by hand: originals live in `media/goods_icons/`; before referencing one from
`content/products.json`, create a compressed web copy in `media/web/` (max 1000px on the
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

- `tests/data.spec.js` — validates `content/*.json` (every text/name/description filled
  in all 4 languages, `{placeholders}` kept in translations, numeric prices, categories
  exist, images are local `media/` files that exist, every `data-i18n` key and `t()` key
  exists) and `admin/` (repo + token-only sign-in, no secrets, photo optimization on,
  pinned CMS script with SRI, the editor forms mirror the JSON exactly), and checks all
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
- `tests/i18n.spec.js` — switching language updates static text, products, categories,
  title and an open modal; switching back restores English; the choice persists across
  pages; filters keep working; a missing translation falls back to English. Also: HTML
  typed into a product name or page text is displayed literally (no injection), a
  leading-slash image path still loads, and a failed product load shows a message.
- `tests/helpers.js` — loads `content/*.json` for the specs and waits for pages to finish
  loading it (`data-texts-ready` / `data-shop-ready` on `<html>`). Tests read expected
  values from the content files, so legitimate CMS edits don't break them.
- **CI**: `.github/workflows/tests.yml` runs everything except the visual tests on every
  push/PR. Visual baselines are Windows-specific and change with every content edit —
  regenerate them locally (`npm run test:update-snapshots`) after pulling content changes.
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
