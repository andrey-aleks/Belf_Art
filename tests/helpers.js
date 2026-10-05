const fs = require("fs");
const path = require("path");

const { mergeLocales } = require("../js/content.js");

const ROOT = path.join(__dirname, "..");
const LANGS = ["en", "ru", "uk", "pl"];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

// The editable content (content/*.json). Tests read it rather than hard-coding values, so
// they keep passing when the editor legitimately changes texts or products in the CMS.
// raw* = the files as stored ({ en: {...}, ru: {...}, ... }); the others are merged the
// same way the site merges them (js/content.js mergeLocales), so read their texts
// through inLang().
const rawTexts = readJson("content/texts.json");
const rawProducts = readJson("content/products.json");
const rawCategories = readJson("content/categories.json");
const { products } = mergeLocales(rawProducts);
const { categories } = mergeLocales(rawCategories);
const texts = mergeLocales(rawTexts);
const site = readJson("content/site.json");

// A merged value is { en, ru, uk, pl }, or a plain string when all languages agree.
function inLang(value, lang = "en") {
  return value !== null && typeof value === "object" ? value[lang] : value;
}

// Same normalization as js/content.js assetUrl(): the CMS writes "/media/web/x.webp".
function assetPath(p) {
  return String(p || "").replace(/^\/+/, "");
}

function text(key, lang = "en") {
  const [group, field] = key.split(".");
  return inLang(texts[group][field], lang);
}

// Pages load their content with fetch(); wait until it has been applied.
async function gotoAndWait(page, url) {
  await page.goto(url);
  await waitForContent(page);
}

async function waitForContent(page) {
  await page.waitForFunction(() => {
    const ds = document.documentElement.dataset;
    const needsShop = !!document.getElementById("product-grid");
    return ds.textsReady === "true" && (!needsShop || ds.shopReady === "true");
  });
}

module.exports = {
  ROOT,
  LANGS,
  products,
  categories,
  texts,
  rawTexts,
  rawProducts,
  rawCategories,
  site,
  inLang,
  assetPath,
  text,
  gotoAndWait,
  waitForContent,
  readJson,
};
