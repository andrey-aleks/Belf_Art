const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { cssVersion, PAGES: HTML_PAGES } = require("../scripts/update-css-version.js");
const { ROOT, LANGS, products, categories, texts, site, assetPath } = require("./helpers");

// Content is edited through the CMS (/admin/), and GitHub runs these checks on every
// change (.github/workflows/tests.yml), so a broken edit is reported by email.

function expectLocalImage(p, label) {
  expect(typeof p === "string" && p.length > 0, `${label}: missing image path`).toBe(true);
  // Only images stored in this repo: no external URLs (tracking pixels, hotlinks) and no
  // path tricks.
  expect(p, `${label}: must be a media/ path, got "${p}"`).toMatch(/^\/?media\/[A-Za-z0-9._\/-]+$/);
  expect(p, `${label}: must not contain ".."`).not.toContain("..");
  expect(fs.existsSync(path.join(ROOT, assetPath(p))), `${label}: file not found: ${p}`).toBe(true);
}

function expectAllLanguages(value, label) {
  for (const lang of LANGS) {
    expect(typeof value?.[lang] === "string" && value[lang].trim().length > 0, `${label}: "${lang}" is empty`).toBe(true);
  }
}

test.describe("product content (content/products.json)", () => {
  test("has at least one product", () => {
    expect(products.length).toBeGreaterThan(0);
  });

  products.forEach((p, i) => {
    const label = `product #${i + 1} (${p.name?.en || "unnamed"})`;

    test(`${label} is well-formed`, () => {
      expectAllLanguages(p.name, `${label} name`);
      expectAllLanguages(p.description, `${label} description`);
      expect(typeof p.price === "number" && Number.isFinite(p.price) && p.price >= 0, `${label} price`).toBe(true);
      expect(typeof p.soldOut, `${label} soldOut`).toBe("boolean");
      expect(categories.map((c) => c.key), `${label} category must exist in content/categories.json`).toContain(p.category);
      expect(Array.isArray(p.images) && p.images.length > 0, `${label} needs at least one photo`).toBe(true);
      p.images.forEach((img, j) => expectLocalImage(img, `${label} photo ${j + 1}`));
    });
  });
});

test.describe("category content (content/categories.json)", () => {
  test("keys are unique and every category is labelled in all languages", () => {
    const keys = categories.map((c) => c.key);
    expect(new Set(keys).size, "duplicate category keys").toBe(keys.length);
    for (const c of categories) expectAllLanguages(c.label, `category ${c.key}`);
  });
});

test.describe("page content (content/texts.json, content/site.json)", () => {
  test("every text is filled in for every language", () => {
    for (const [group, fields] of Object.entries(texts)) {
      for (const [field, value] of Object.entries(fields)) expectAllLanguages(value, `${group}.${field}`);
    }
  });

  test("placeholders like {name} are kept in every translation", () => {
    for (const [group, fields] of Object.entries(texts)) {
      for (const [field, value] of Object.entries(fields)) {
        for (const placeholder of value.en.match(/\{\w+\}/g) || []) {
          for (const lang of LANGS) {
            expect(value[lang], `${group}.${field} (${lang}) must contain ${placeholder}`).toContain(placeholder);
          }
        }
      }
    }
  });

  test("every text key used by the pages exists in texts.json", () => {
    const missing = [];
    for (const file of HTML_PAGES) {
      const html = fs.readFileSync(path.join(ROOT, file), "utf8");
      for (const m of html.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)) {
        const [group, field] = m[1].split(".");
        if (!texts[group] || !texts[group][field]) missing.push(`${file}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("every text key used by the scripts exists in texts.json", () => {
    const js = ["js/main.js", "js/i18n.js"].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
    const keys = new Set([...js.matchAll(/\bt\("([a-z]+\.[A-Za-z0-9]+)"/g)].map((m) => m[1]));
    expect(keys.size).toBeGreaterThan(0);
    const missing = [...keys].filter((k) => {
      const [group, field] = k.split(".");
      return !texts[group] || !texts[group][field];
    });
    expect(missing).toEqual([]);
  });

  test("site photos exist", () => {
    expectLocalImage(site.heroImage, "heroImage");
    if (site.aboutPhoto) expectLocalImage(site.aboutPhoto, "aboutPhoto");
  });
});

test.describe("CMS configuration (admin/)", () => {
  const configText = fs.readFileSync(path.join(ROOT, "admin", "config.yml"), "utf8");
  const config = yaml.load(configText);
  const adminHtml = fs.readFileSync(path.join(ROOT, "admin", "index.html"), "utf8");

  const collectionFile = (collection, file) =>
    config.collections.find((c) => c.name === collection).files.find((f) => f.name === file);

  test("points at this repository and allows token sign-in only", () => {
    expect(config.backend.name).toBe("github");
    expect(config.backend.repo).toBe("andrey-aleks/Belf_Art");
    expect(config.backend.auth_methods).toEqual(["token"]);
  });

  test("contains no secrets (the repo is public)", () => {
    // OAuth client secrets, tokens and passwords must never be committed.
    // Checks the parsed values (YAML comments are dropped), so the warning comment at
    // the top of config.yml doesn't trip it.
    expect(JSON.stringify(config)).not.toMatch(/secret|password|client_id|ghp_|github_pat_|gho_/i);
    expect(adminHtml).not.toMatch(/ghp_|github_pat_|gho_/);
  });

  test("uploads are resized and re-encoded (strips EXIF such as GPS location)", () => {
    const raster = config.media_libraries.all.transformations.raster_image;
    expect(raster.format).toBe("webp");
    expect(raster.width).toBeLessThanOrEqual(2000);
    expect(raster.height).toBeLessThanOrEqual(2000);
    expect(config.media_folder).toBe("media/web");
  });

  test("the CMS script is pinned to an exact version with Subresource Integrity", () => {
    const scripts = [...adminHtml.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toMatch(/src="https:\/\/unpkg\.com\/@sveltia\/cms@\d+\.\d+\.\d+\/dist\/sveltia-cms\.js"/);
    expect(scripts[0]).toMatch(/integrity="sha384-[A-Za-z0-9+/=]+"/);
    expect(scripts[0]).toContain('crossorigin="anonymous"');
    expect(adminHtml).toMatch(/<meta name="robots" content="noindex/);
  });

  test("the editor form covers exactly the texts in texts.json", () => {
    const textFields = collectionFile("site", "texts").fields;
    const formKeys = textFields.flatMap((group) => group.fields.map((f) => `${group.name}.${f.name}`)).sort();
    const contentKeys = Object.entries(texts).flatMap(([g, fields]) => Object.keys(fields).map((f) => `${g}.${f}`)).sort();
    expect(formKeys).toEqual(contentKeys);

    for (const group of textFields) {
      for (const f of group.fields) {
        expect(f.fields.map((l) => l.name), `${group.name}.${f.name} languages`).toEqual(LANGS);
      }
    }
  });

  test("the product form covers every product field", () => {
    const productFields = collectionFile("shop", "products").fields[0].fields.map((f) => f.name).sort();
    const dataFields = [...new Set(products.flatMap((p) => Object.keys(p)))].sort();
    expect(productFields).toEqual(dataFields);
  });

  test("every configured content file exists", () => {
    for (const collection of config.collections) {
      for (const file of collection.files) {
        expect(fs.existsSync(path.join(ROOT, file.file)), file.file).toBe(true);
      }
    }
  });
});

test.describe("no leftover placeholders", () => {
  const files = [...HTML_PAGES, "js/main.js", "js/content.js", "js/i18n.js", "content/texts.json", "content/products.json"];

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
    ".order-button",
    ".site-nav a",
    ".site-logo",
    ".hero-cta",
    ".footer-link",
    ".footer-questions",
    ".contact-link",
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
