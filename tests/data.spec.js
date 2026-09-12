const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { products } = require("../js/data.js");
const { cssVersion, PAGES: HTML_PAGES } = require("../scripts/update-css-version.js");

const ROOT = path.join(__dirname, "..");

test.describe("product data integrity", () => {
  test("has at least one product", () => {
    expect(products.length).toBeGreaterThan(0);
  });

  test("product ids are unique", () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("each product has required, well-formed fields", () => {
    for (const p of products) {
      expect(typeof p.id, `id of ${JSON.stringify(p)}`).toBe("number");
      expect(p.name && p.name.trim().length > 0, `name of ${JSON.stringify(p)}`).toBe(true);
      expect(p.price, `price of "${p.name}"`).toMatch(/^\d+(\.\d+)?\s?(EUR|USD)$/);
      expect(p.image && p.image.trim().length > 0, `image of "${p.name}"`).toBe(true);
      expect(p.description && p.description.trim().length > 0, `description of "${p.name}"`).toBe(true);
      expect(Array.isArray(p.images) && p.images.length > 0, `images of "${p.name}"`).toBe(true);
      expect(p.category && p.category.trim().length > 0, `category of "${p.name}"`).toBe(true);
      expect(typeof p.soldOut, `soldOut of "${p.name}"`).toBe("boolean");
    }
  });

  test("every referenced product image exists on disk", () => {
    for (const p of products) {
      const imgPath = path.join(ROOT, p.image);
      expect(fs.existsSync(imgPath), `Missing image file for "${p.name}": ${p.image}`).toBe(true);

      for (const galleryImage of p.images) {
        const galleryPath = path.join(ROOT, galleryImage);
        expect(fs.existsSync(galleryPath), `Missing gallery image for "${p.name}": ${galleryImage}`).toBe(true);
      }
    }
  });
});

test.describe("no leftover placeholders", () => {
  const files = ["index.html", "about.html", "shipping.html", "js/main.js", "js/data.js"];

  for (const file of files) {
    test(`${file} does not contain a placeholder Instagram handle`, () => {
      const content = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(content).not.toMatch(/your_instagram/i);
    });
  }
});

test.describe("visited-link color safety", () => {
  // Guards against the bug we hit: browsers apply a built-in `a:visited { color: purple }`
  // rule that beats a plain author class selector on specificity, so any link a real
  // visitor has actually clicked (e.g. our own Instagram profile, which a real visitor is
  // very likely to have visited outside this site) silently loses its themed color. This
  // can't be caught by rendering assertions — browsers deliberately hide the real
  // `:visited` computed style from scripts (including Playwright) to prevent
  // history-sniffing — so this checks the CSS source directly for the required override.
  // New custom-colored <a> classes must be added to this list AND given a matching
  // `:visited` rule in css/style.css.
  const linkSelectorsNeedingVisitedOverride = [
    ".instagram-link",
    ".order-button",
    ".site-nav a",
    ".site-footer a",
    ".shipping-content a",
  ];

  const cssContent = fs.readFileSync(path.join(ROOT, "css", "style.css"), "utf8");

  for (const selector of linkSelectorsNeedingVisitedOverride) {
    const visitedSelector = selector.endsWith(" a") ? selector.replace(/ a$/, " a:visited") : `${selector}:visited`;

    test(`${selector} has an explicit ${visitedSelector} color override`, () => {
      expect(cssContent, `Expected css/style.css to contain "${visitedSelector}"`).toContain(visitedSelector);
    });
  }
});

test.describe("css cache-busting", () => {
  // Guards against the exact bug we hit: css/style.css was edited many times while every
  // page kept requesting the same bare URL, so browsers kept serving an old cached copy
  // missing the newer rules (nav, section titles, about/shipping content). The version
  // query string must be derived from the CSS file's own content hash (via
  // `npm run css:version`) and be present, identical, on every page.
  const expectedVersion = cssVersion();

  for (const file of HTML_PAGES) {
    test(`${file} requests css/style.css with the current content-hash version`, () => {
      const content = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(
        content,
        `${file} is missing "css/style.css?v=${expectedVersion}" — run "npm run css:version" after editing css/style.css`
      ).toContain(`href="css/style.css?v=${expectedVersion}"`);
    });
  }
});
