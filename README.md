# Belf Art

A simple static website for a handmade-goods shop. No backend, no build step, no payment
processing — customers browse a grid of products and order by messaging the shop on
Instagram.

## Structure

- `index.html` — page markup (header, product grid container, footer)
- `css/style.css` — all styling
- `js/data.js` — the product catalog (edit this to add/remove/change products)
- `js/main.js` — renders the product grid from `data.js`

## Adding or editing products

Open `js/data.js` and edit the `products` array. Each product needs:

```js
{
  id: 7,
  name: "Product Name",
  price: "20 USD",
  image: "path/or/url/to/image.jpg",
}
```

Also update the `INSTAGRAM_URL` constant in `js/main.js` and the Instagram links in
`index.html` with the real Instagram profile URL.

## Running locally

This is a plain static site, so any static file server works, e.g.:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Hosting on GitHub Pages

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch".
4. Choose the `master` branch and `/ (root)` folder, then save.
5. GitHub will publish the site at `https://<username>.github.io/<repo-name>/`.
