# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

A plain static HTML/CSS/JS site for a handmade-goods shop — no framework, no build step,
no backend, no payment processing. Customers browse a product grid and order by messaging
the shop on Instagram.

## Commands

There is no build/lint/test tooling. To preview locally, serve the directory with any
static file server, e.g.:

```bash
python -m http.server 5500
```

(A `.claude/launch.json` config named `static-server` already does this for browser
previews in this tool.)

## Architecture

- `index.html` — static page shell: header (shop name + Instagram link), an empty
  `#product-grid` container, and a footer. Loads `js/data.js` then `js/main.js`.
- `js/data.js` — the product catalog as a plain `products` array (id, name, price, image
  URL). This is the only file that needs editing to add/remove/change products.
- `js/main.js` — reads `products` and renders one `.product-card` per item into
  `#product-grid`. Also defines `INSTAGRAM_URL`, used for every "Order via Instagram"
  link/button.
- `css/style.css` — all styling: a dark/gothic/elegant theme (near-black background, gold
  accent, serif display font via Google Fonts) and a responsive CSS grid
  (`repeat(auto-fill, minmax(...))`) for the product cards.

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