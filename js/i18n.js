// Language switching for every page.
//
// All page texts live in content/texts.json (editable through the CMS at /admin/), stored
// per language and merged by fetchLocalizedContent() (js/content.js) into
// { group: { field: { en, ru, uk, pl } } } (or a plain string if all languages agree). Elements are tagged with
// data-i18n="group.field" (textContent) or data-i18n-aria-label="group.field"
// (aria-label). The English text already in the HTML is only a fallback for the moment
// before texts.json has loaded (or if it fails to load).
//
// Product names/descriptions become { en, ru, uk, pl } objects the same way; see
// localizedProduct(). Everything is inserted as text, never as HTML.

const LANGUAGES = ["en", "ru", "uk", "pl"];
const DEFAULT_LANGUAGE = "en";
const LANGUAGE_STORAGE_KEY = "belfegor-lang";

// Fallbacks for strings rendered by JS, used only if texts.json can't be loaded.
const FALLBACK_TEXTS = {
  "product.soldOut": "Sold Out",
  "product.order": "Order via Instagram",
  "product.viewDetails": "View details for {name}",
  "product.loadError": "Products could not be loaded. Please refresh the page.",
  "modal.photo": "Show photo {n}",
  "shop.empty": "No products match your filters.",
  "categories.all": "All",
};

let currentLanguage = DEFAULT_LANGUAGE;
let texts = {};

// English originals captured from the HTML, keyed by element + attribute.
const originalText = new WeakMap();

function readStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeLanguage(lang) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Storage can be unavailable (private mode, blocked site data) — switching still
    // works for this page view, it just won't be remembered.
  }
}

function detectLanguage() {
  const stored = readStoredLanguage();
  if (LANGUAGES.includes(stored)) return stored;

  const browser = (navigator.language || "").slice(0, 2).toLowerCase();
  if (LANGUAGES.includes(browser)) return browser;

  return DEFAULT_LANGUAGE;
}

// Picks the current language from a { en, ru, uk, pl } object, falling back to English.
// Plain strings are returned as-is.
function localize(value) {
  if (value == null) return "";
  if (typeof value !== "object") return String(value);
  return value[currentLanguage] || value[DEFAULT_LANGUAGE] || "";
}

function lookup(key) {
  const [group, field] = key.split(".");
  const entry = texts[group] && texts[group][field];
  return entry ? localize(entry) : null;
}

function t(key, params = {}) {
  let text = lookup(key) || FALLBACK_TEXTS[key] || key;
  for (const [name, value] of Object.entries(params)) {
    text = text.split(`{${name}}`).join(value);
  }
  return text;
}

function localizedProduct(product) {
  return {
    ...product,
    name: localize(product.name),
    description: localize(product.description),
  };
}

function translateElement(el, attr, key) {
  let originals = originalText.get(el);
  if (!originals) {
    originals = {};
    originalText.set(el, originals);
  }

  const read = () => (attr === "text" ? el.textContent : el.getAttribute(attr));
  const write = (value) => (attr === "text" ? (el.textContent = value) : el.setAttribute(attr, value));

  if (!(attr in originals)) originals[attr] = read();
  write(lookup(key) || originals[attr]);
}

function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => translateElement(el, "text", el.dataset.i18n));
  root
    .querySelectorAll("[data-i18n-aria-label]")
    .forEach((el) => translateElement(el, "aria-label", el.dataset.i18nAriaLabel));

  document.querySelectorAll(".lang-select").forEach((select) => {
    select.value = currentLanguage;
  });
}

function setLanguage(lang) {
  if (!LANGUAGES.includes(lang)) return;
  currentLanguage = lang;
  storeLanguage(lang);
  document.documentElement.lang = lang;
  applyTranslations();
  document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
}

function getLanguage() {
  return currentLanguage;
}

// Resolves once texts.json has been applied (or failed to load — the HTML's English
// fallback stays in place then). main.js waits on this before rendering products.
let textsReady = Promise.resolve();

function initI18n() {
  document.querySelectorAll(".lang-select").forEach((select) => {
    select.addEventListener("change", () => setLanguage(select.value));
  });

  currentLanguage = detectLanguage();
  document.documentElement.lang = currentLanguage;
  applyTranslations();

  textsReady = fetchLocalizedContent("content/texts.json")
    .then((loaded) => {
      texts = loaded;
      applyTranslations();
    })
    .catch((error) => console.error("Could not load page texts:", error))
    .finally(() => {
      document.documentElement.dataset.textsReady = "true";
    });
}

if (typeof document !== "undefined") {
  initI18n();
}

if (typeof module !== "undefined") {
  module.exports = { LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_TEXTS };
}
