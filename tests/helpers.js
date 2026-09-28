const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LANGS = ["en", "ru", "uk", "pl"];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

// The editable content (content/*.json). Tests read it rather than hard-coding values, so
// they keep passing when the editor legitimately changes texts or products in the CMS.
const { products } = readJson("content/products.json");
const { categories } = readJson("content/categories.json");
const texts = readJson("content/texts.json");
const site = readJson("content/site.json");

// Same normalization as js/content.js assetUrl(): the CMS writes "/media/web/x.webp".
function assetPath(p) {
  return String(p || "").replace(/^\/+/, "");
}

function text(key, lang = "en") {
  const [group, field] = key.split(".");
  return texts[group][field][lang];
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

module.exports = { ROOT, LANGS, products, categories, texts, site, assetPath, text, gotoAndWait, waitForContent, readJson };
