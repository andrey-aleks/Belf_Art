const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const CSS_PATH = path.join(ROOT, "css", "style.css");
const PAGES = ["index.html", "about.html", "shipping.html"];
const LINK_PATTERN = /href="css\/style\.css(?:\?v=[a-f0-9]+)?"/;

function cssVersion() {
  const content = fs.readFileSync(CSS_PATH);
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
}

function applyVersion(version) {
  let changedCount = 0;

  for (const page of PAGES) {
    const filePath = path.join(ROOT, page);
    const html = fs.readFileSync(filePath, "utf8");
    const updated = html.replace(LINK_PATTERN, `href="css/style.css?v=${version}"`);

    if (updated !== html) {
      fs.writeFileSync(filePath, updated);
      console.log(`Updated ${page} -> css/style.css?v=${version}`);
      changedCount++;
    } else {
      console.log(`${page} already up to date (v=${version})`);
    }
  }

  return changedCount;
}

if (require.main === module) {
  applyVersion(cssVersion());
}

module.exports = { cssVersion, LINK_PATTERN, PAGES, ROOT };
