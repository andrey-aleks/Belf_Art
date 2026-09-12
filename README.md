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
  image: "media/web/your-photo.jpg",
}
```

Also update the `INSTAGRAM_URL` constant in `js/main.js` and the Instagram links in
`index.html` with the real Instagram profile URL.

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
  every referenced image actually exists on disk) and checks all three pages for leftover
  placeholder text (e.g. a forgotten `your_instagram`).
- `tests/shop.spec.js` — loads the Shop page and checks: the grid renders exactly one
  card per product, every card has an image/name/price/working Instagram link, no image
  fails to load, no request returns an error status, the grid is geometrically uniform
  (equal-width cards, single column on narrow viewports, multiple columns on wide ones,
  no horizontal overflow), and the "Order via Instagram" button sits at the same offset
  in every card regardless of product name length.
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

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch".
4. Choose the `master` branch and `/ (root)` folder, then save.
5. GitHub will publish the site at `https://<username>.github.io/<repo-name>/`.
