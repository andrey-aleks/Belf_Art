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

- `index.html` — static page shell: header (shop name + Instagram link), an empty
  `#product-grid` container, and a footer. Loads `js/data.js` then `js/main.js`.
- `js/data.js` — the product catalog as a plain `products` array (id, name, price, image
  URL). This is the only file that needs editing to add/remove/change products.
- `media/goods_icons/` — original, full-resolution product photos (not referenced directly
  by the site). `media/web/` — compressed/resized copies (max 1000px, JPEG q78) that
  `data.js` actually points to, since raw phone photos are 1.6-6MB each and would make the
  page slow to load. Generate new web copies with Pillow before adding a product photo —
  see README.md.
- `js/main.js` — reads `products` and renders one `.product-card` per item into
  `#product-grid`. Also defines `INSTAGRAM_URL`, used for every "Order via Instagram"
  link/button.
- `css/style.css` — all styling: a dark/gothic/elegant theme (near-black background with a
  subtle grain texture, cool silver text/borders, blood-red accent — colors picked to
  match the jewelry photos themselves) and a responsive CSS grid
  (`repeat(auto-fill, minmax(...))`) for the product cards.
- `tests/` — Playwright test suite (`data.spec.js` data integrity, `shop.spec.js`
  functional/layout checks, `visual.spec.js` screenshot regression). See README.md for
  how to run them. `tests/visual.spec.js-snapshots/` holds the committed baseline images.

There is intentionally no cart, checkout, or payment integration — ordering happens off-site
via Instagram DM, so the site only needs to display products and link out.

Hosting target: GitHub Pages (deploy from branch, root folder) — see README.md.

## Workflow rules

Do not hallucinate, verify things you are suggesting. If you can't be sure, say it plainly instead of imagining.
For complex tasks:
- Inspect existing examples first.
- Reuse established patterns.
- Compare proposed solutions against working implementations.
- Try to reuse and adapt existing solutions whenever possible.
- Iterate with user through tight feedback loops.
- Present a step-by-step plan or review before execution.
- List the files you intend to modify.