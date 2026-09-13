# Belf Art

A simple static website for a handmade-goods shop. No backend, no build step, no payment
processing — customers browse a grid of products and order by messaging the shop on
Instagram.

## Structure

Three pages, sharing the same header/nav/footer markup (hand-duplicated — no templating):

- `index.html` — Shop (the product grid)
- `about.html` — About Me
- `shipping.html` — Shipping info
- `css/style.css` — all styling
- `js/data.js` — the product catalog (edit this to add/remove/change products)
- `js/main.js` — renders the product grid from `data.js` (only loaded on `index.html`)

Adding a new page: copy an existing page's header/nav/footer, update each page's nav to
mark the new link with `aria-current="page"` on the right page, and add the link to the
other two pages' nav too.

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
  category: "Necklace",                    // shows up as a filter checkbox automatically —
                                            // reuse an existing category or introduce a new one
  soldOut: false,                          // true shows a "SOLD OUT" badge and disables ordering
}
```

Also update the `INSTAGRAM_URL` constant in `js/main.js` and the Instagram links in
`index.html` with the real Instagram profile URL.

## Shop filters and sorting

The Shop page has a filter/sort sidebar (Availability, Category, Sort by), styled after
[boldestudios.com/collections/the-shop](https://www.boldestudios.com/collections/the-shop)
but scaled down for a 5-product, no-cart catalog (no search, cart, or price slider). The
Category checkboxes are generated from whatever `category` values exist in `js/data.js`
— adding a product with a new category needs no HTML changes. Marking a product
`soldOut: true` shows a "SOLD OUT" badge on its card, disables its order control (and the
modal's), and moves it under the "Out of stock" availability filter.

## Product detail modal

Clicking a product card (or focusing it and pressing Enter/Space) opens a modal with the
larger photo(s), description, and price — see `#product-modal` in `index.html` and the
`openModal`/`closeModal` functions in `js/main.js`. Closes via its close button, the
backdrop, or Escape. No extra setup needed: it's driven entirely by each product's
`images`/`description` fields in `js/data.js`.

## Editing the About page

`about.html` has placeholder bio text (`[Your Name]`, `[X years]`, `[Your City]`) —
replace these with the real details. The `.about-photo` box is a styled placeholder; swap
it for a real `<img>` (optimized the same way as product photos, see below) once a photo
is ready.

## Editing the Shipping page

`shipping.html` has placeholder shipping specifics (`[City]`, `[Carrier]`, `[X]` business
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
  image actually exists on disk) and checks all three pages for leftover placeholder text
  (e.g. a forgotten `your_instagram`).
- `tests/shop.spec.js` — loads the Shop page and checks: the grid renders exactly one
  card per product, every card has an image/name/price and no order button (ordering only
  happens in the detail modal), no image fails to load, no request returns an error
  status, the grid is geometrically uniform (equal-width cards, single column on narrow
  viewports, multiple columns on wide ones, no horizontal overflow), and the price sits
  at the same offset in every card regardless of product name length.
- `tests/product-modal.spec.js` — the click-to-view-details modal: opens with the right
  product's photo/name/description/price/Instagram link, replaces its content correctly
  across opens, closes via the close button/backdrop/Escape and returns focus to the
  triggering card, keyboard-openable (Enter on a focused card), clicking the modal's own
  Order button does not close the modal, single-image products show no thumbnail row, and
  multi-image products show thumbnails that switch the main photo.
- `tests/filters.spec.js` — the Shop filter/sort sidebar: a checkbox exists for every
  distinct category in the data (all checked by default), unchecking a category or the
  "In stock" availability option hides exactly the right products and re-checking
  restores them, each sort option orders cards correctly (price asc/desc, name A-Z),
  "Most relevant" restores the original catalog order, filtering out everything shows an
  empty-state message, and a sold-out product shows its badge on the card and a disabled
  order control in the modal, while an in-stock product shows neither.
- `tests/sections.spec.js` — for each of the 3 pages: checks the nav has all 3 links in
  the right order, exactly the current page is marked `aria-current="page"`, the header
  Instagram link works, and clicking each other nav link actually navigates to that page.
  Also checks About's heading/photo placeholder/non-empty bio, and Shipping's heading,
  mention of Poland, and working Instagram link.
- `tests/visual.spec.js` — full-page screenshot comparison for all three pages against a
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
