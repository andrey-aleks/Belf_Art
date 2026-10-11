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

// Shop links (content/links.json — "Site → Shop links" in the CMS). Elements carry
//   data-link="instagram"          → href is set to the link (mailto: for email)
//   data-link-handle="instagram"   → text becomes "@name" (or the email address)
//   data-link-optional="email"     → hidden while that link is empty
// The HTML already holds working default addresses, so pages work before (or without)
// links.json. These values end up in href attributes, so each one must match what it
// claims to be: anything else — a typo, or a `javascript:` URL — is ignored and the
// default stays. admin/config.yml uses the same patterns to reject bad input up front
// (tests/data.spec.js checks they stay identical).
const LINK_RULES = {
  instagram: /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/,
  telegram: /^https:\/\/t\.me\/[A-Za-z0-9_]+\/?$/,
  vinted: /^https:\/\/(www\.)?vinted\.[a-z]{2,3}(\.[a-z]{2})?\/[A-Za-z0-9._\/-]+$/,
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
};

const shopLinks = {};

function validLink(kind, value) {
  const trimmed = String(value || "").trim();
  return LINK_RULES[kind] && LINK_RULES[kind].test(trimmed) ? trimmed : "";
}

function linkHref(kind, value) {
  return kind === "email" ? `mailto:${value}` : value;
}

// "@be1fegor_jewelry" for profile URLs, "be1fegor" for Vinted's "/member/123-be1fegor".
function linkHandle(kind, value) {
  if (kind === "email") return value;
  const last = new URL(value).pathname.split("/").filter(Boolean).pop() || "";
  return kind === "vinted" ? last.replace(/^\d+-/, "") : `@${last}`;
}

// The link to use for `kind`, or `fallback` if links.json hasn't provided a valid one.
function shopLink(kind, fallback) {
  return shopLinks[kind] ? linkHref(kind, shopLinks[kind]) : fallback;
}

function applyShopLinks(links) {
  for (const kind of Object.keys(LINK_RULES)) {
    const raw = links && links[kind];
    const value = validLink(kind, raw);
    if (raw && !value) console.warn(`Ignoring invalid ${kind} link in content/links.json:`, raw);
    if (value) shopLinks[kind] = value;

    document.querySelectorAll(`[data-link="${kind}"]`).forEach((el) => {
      if (value) el.href = linkHref(kind, value);
    });
    document.querySelectorAll(`[data-link-handle="${kind}"]`).forEach((el) => {
      if (value) el.textContent = linkHandle(kind, value);
    });
    document.querySelectorAll(`[data-link-optional="${kind}"]`).forEach((el) => {
      el.hidden = !value;
    });
  }
}

if (typeof document !== "undefined") {
  fetchContent("content/site.json")
    .then(applySiteImages)
    .catch((error) => console.error("Could not load site images:", error));

  fetchContent("content/links.json")
    .then(applyShopLinks)
    .catch((error) => console.error("Could not load shop links:", error))
    .finally(() => {
      document.documentElement.dataset.linksReady = "true";
    });
}

if (typeof module !== "undefined") {
  module.exports = { assetUrl, mergeLocales, LINK_RULES, validLink, linkHandle };
}
