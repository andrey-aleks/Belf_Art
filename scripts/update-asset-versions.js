// Stamps a content-hash query string onto every local CSS/JS file the pages load
// (css/style.css?v=<hash>, js/main.js?v=<hash>, ...).
//
// Without a changing URL, caches keep serving an old copy after a deploy: browsers (up to
// 4 h, GitHub Pages' max-age) and Cloudflare in front of belfegor.shop, which caches .js
// and .css but not .html/.json. Both bit us for real — stale CSS once, and after the
// per-language content change the old cached main.js read the new products.json and
// showed an empty shop. A new hash is a new URL, so it bypasses every cache.
//
// Run after editing any of ASSETS: `npm run assets:version`. tests/data.spec.js
// ("asset cache-busting") fails if a page's version doesn't match the file's content.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const PAGES = ["index.html", "about.html", "custom-orders.html", "shipping.html", "contact.html"];
const ASSETS = ["css/style.css", "js/content.js", "js/i18n.js", "js/main.js"];

function assetVersion(asset) {
  const content = fs.readFileSync(path.join(ROOT, asset));
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
}

function cssVersion() {
  return assetVersion("css/style.css");
}

// Matches href="css/style.css" / src="js/main.js", with or without an old ?v=.
function assetPattern(asset) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`((?:href|src)=")${escaped}(?:\\?v=[a-f0-9]+)?(")`, "g");
}

function applyVersions() {
  let changedCount = 0;
  const versions = Object.fromEntries(ASSETS.map((asset) => [asset, assetVersion(asset)]));

  for (const page of PAGES) {
    const filePath = path.join(ROOT, page);
    const html = fs.readFileSync(filePath, "utf8");
    let updated = html;
    for (const asset of ASSETS) updated = updated.replace(assetPattern(asset), `$1${asset}?v=${versions[asset]}$2`);

    if (updated !== html) {
      fs.writeFileSync(filePath, updated);
      console.log(`Updated ${page}`);
      changedCount++;
    } else {
      console.log(`${page} already up to date`);
    }
  }

  return changedCount;
}

if (require.main === module) {
  applyVersions();
}

module.exports = { assetVersion, cssVersion, ASSETS, PAGES, ROOT };
