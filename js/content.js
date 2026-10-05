// Loads the editable content in content/*.json (edited through the CMS at /admin/).
//
// `cache: "no-cache"` makes the browser revalidate with the server on every load, so a
// change published from the CMS shows up as soon as GitHub Pages has deployed it
// instead of after the HTTP cache expires.

function fetchContent(path) {
  return fetch(path, { cache: "no-cache" }).then((response) => {
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  });
}

// Translatable files (texts, products, categories) are stored the way the CMS's i18n
// support needs them — one copy per language at the top of the file:
//   { "en": { "hero": { "title": "Shop" } }, "ru": { "hero": { "title": "Магазин" } } }
// mergeLocales() turns that back into one tree with the languages at the leaves, which
// is what the rest of the code reads (localize() in i18n.js):
//   { "hero": { "title": { "en": "Shop", "ru": "Магазин" } } }
// The English tree defines the structure (lists and keys). A text becomes a
// { lang: text } object only where the languages differ; values that are the same in
// every language (prices, photo paths, category keys) stay plain values.
const CONTENT_DEFAULT_LOCALE = "en";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergeLocales(data) {
  if (!isPlainObject(data) || !isPlainObject(data[CONTENT_DEFAULT_LOCALE])) return data;
  const locales = Object.keys(data);

  const merge = (byLocale) => {
    const base = byLocale[CONTENT_DEFAULT_LOCALE];
    if (Array.isArray(base)) {
      return base.map((_, i) => merge(pick(byLocale, (v) => (Array.isArray(v) ? v[i] : undefined))));
    }
    if (isPlainObject(base)) {
      const result = {};
      for (const key of Object.keys(base)) result[key] = merge(pick(byLocale, (v) => (isPlainObject(v) ? v[key] : undefined)));
      return result;
    }
    if (typeof base === "string" && locales.some((l) => byLocale[l] !== undefined && byLocale[l] !== base)) {
      const localized = {};
      for (const l of locales) if (typeof byLocale[l] === "string") localized[l] = byLocale[l];
      return localized;
    }
    return base;
  };
  const pick = (byLocale, get) => Object.fromEntries(locales.map((l) => [l, get(byLocale[l])]));

  return merge(data);
}

function fetchLocalizedContent(path) {
  return fetchContent(path).then(mergeLocales);
}

// Content paths are stored relative ("media/web/x.webp") because the site is served from
// a sub-path on GitHub Pages; strip a leading slash defensively in case one slips in.
function assetUrl(path) {
  return String(path || "").replace(/^\/+/, "");
}

function applySiteImages(site) {
  const hero = document.querySelector(".hero-image");
  if (hero && site.heroImage) hero.src = assetUrl(site.heroImage);

  const aboutPhoto = document.querySelector(".about-photo");
  if (aboutPhoto && site.aboutPhoto) {
    const img = document.createElement("img");
    img.className = "about-photo-image";
    img.src = assetUrl(site.aboutPhoto);
    img.alt = "";
    aboutPhoto.replaceChildren(img);
    aboutPhoto.classList.add("has-photo");
  }
}

if (typeof document !== "undefined") {
  fetchContent("content/site.json")
    .then(applySiteImages)
    .catch((error) => console.error("Could not load site images:", error));
}

if (typeof module !== "undefined") {
  module.exports = { assetUrl, mergeLocales };
}
