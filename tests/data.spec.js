const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { assetVersion, ASSETS, PAGES: HTML_PAGES } = require("../scripts/update-asset-versions.js");
const { mergeLocales } = require("../js/content.js");
const { ROOT, LANGS, products, categories, texts, rawTexts, rawProducts, rawCategories, site, assetPath } = require("./helpers");

// Content is edited through the CMS (/admin/), and GitHub runs these checks on every
// change (.github/workflows/tests.yml), so a broken edit is reported by email.
//
// Translatable files are stored per language ({ en: {...}, ru: {...}, uk: {...},
// pl: {...} }, the CMS's i18n "single_file" structure); see js/content.js mergeLocales().

function expectLocalImage(p, label) {
  expect(typeof p === "string" && p.length > 0, `${label}: missing image path`).toBe(true);
  // Only images stored in this repo: no external URLs (tracking pixels, hotlinks) and no
  // path tricks.
  expect(p, `${label}: must be a media/ path, got "${p}"`).toMatch(/^\/?media\/[A-Za-z0-9._\/-]+$/);
  expect(p, `${label}: must not contain ".."`).not.toContain("..");
  expect(fs.existsSync(path.join(ROOT, assetPath(p))), `${label}: file not found: ${p}`).toBe(true);
}

function expectFilled(value, label) {
  expect(typeof value === "string" && value.trim().length > 0, `${label} is empty`).toBe(true);
}

function expectAllLanguagesPresent(raw, file) {
  expect(Object.keys(raw).sort(), `${file} must have exactly one section per language`).toEqual([...LANGS].sort());
}

// Fields of a list item that are the same in every language (the CMS keeps them in sync
// with i18n: duplicate); everything else is translated.
function expectSameExceptTranslated(items, translated, label) {
  const strip = (item) => Object.fromEntries(Object.entries(item).filter(([key]) => !translated.includes(key)));
  for (const lang of LANGS) {
    expect(items[lang].length, `${label}: "${lang}" has a different number of items than "en"`).toBe(items.en.length);
    items[lang].forEach((item, i) => {
      expect(strip(item), `${label} #${i + 1}: "${lang}" differs from "en" in a non-translated field`).toEqual(strip(items.en[i]));
    });
  }
}

test.describe("product content (content/products.json)", () => {
  test("has at least one product", () => {
    expect(products.length).toBeGreaterThan(0);
  });

  test("every language has the same products, prices, categories and photos", () => {
    expectAllLanguagesPresent(rawProducts, "products.json");
    expectSameExceptTranslated(
      Object.fromEntries(LANGS.map((lang) => [lang, rawProducts[lang].products])),
      ["name", "description"],
      "product"
    );
  });

  rawProducts.en.products.forEach((p, i) => {
    const label = `product #${i + 1} (${p.name || "unnamed"})`;

    test(`${label} is well-formed`, () => {
      for (const lang of LANGS) {
        const localized = rawProducts[lang].products[i] || {};
        expectFilled(localized.name, `${label} name (${lang})`);
        expectFilled(localized.description, `${label} description (${lang})`);
      }
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
    expectAllLanguagesPresent(rawCategories, "categories.json");
    const keys = categories.map((c) => c.key);
    expect(new Set(keys).size, "duplicate category keys").toBe(keys.length);
    expectSameExceptTranslated(
      Object.fromEntries(LANGS.map((lang) => [lang, rawCategories[lang].categories])),
      ["label"],
      "category"
    );
    for (const lang of LANGS) {
      for (const c of rawCategories[lang].categories) expectFilled(c.label, `category ${c.key} label (${lang})`);
    }
  });
});

test.describe("page content (content/texts.json, content/site.json)", () => {
  const textKeys = (lang) =>
    Object.entries(rawTexts[lang] || {}).flatMap(([group, fields]) => Object.keys(fields).map((field) => `${group}.${field}`));

  test("every text is filled in for every language", () => {
    expectAllLanguagesPresent(rawTexts, "texts.json");
    for (const lang of LANGS) {
      expect(textKeys(lang).sort(), `texts in "${lang}" must match the English ones`).toEqual(textKeys("en").sort());
      for (const [group, fields] of Object.entries(rawTexts[lang])) {
        for (const [field, value] of Object.entries(fields)) expectFilled(value, `${group}.${field} (${lang})`);
      }
    }
  });

  test("placeholders like {name} are kept in every translation", () => {
    for (const [group, fields] of Object.entries(rawTexts.en)) {
      for (const [field, english] of Object.entries(fields)) {
        for (const placeholder of english.match(/\{\w+\}/g) || []) {
          for (const lang of LANGS) {
            expect(rawTexts[lang][group][field], `${group}.${field} (${lang}) must contain ${placeholder}`).toContain(placeholder);
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

  // The CMS's Translate button only exists with its i18n support switched on, and that
  // decides how content is stored (one section per language at the top of the file).
  test("i18n is enabled with the site's languages, stored per language in one file", () => {
    expect(config.i18n.structure).toBe("single_file");
    expect(config.i18n.locales).toEqual(LANGS);
    expect(config.i18n.default_locale).toBe("en");
    for (const [collection, file] of [["shop", "products"], ["shop", "categories"], ["site", "texts"]]) {
      expect(config.collections.find((c) => c.name === collection).i18n, `collection ${collection}`).toBe(true);
      expect(collectionFile(collection, file).i18n, `file ${file}`).toBe(true);
    }
    // Page photos are the same in every language: no i18n, plain file.
    expect(collectionFile("site", "images").i18n).toBeUndefined();
  });

  test("the editor form covers exactly the texts in texts.json, all translatable", () => {
    const textFields = collectionFile("site", "texts").fields;
    const formKeys = textFields.flatMap((group) => group.fields.map((f) => `${group.name}.${f.name}`)).sort();
    const contentKeys = Object.entries(rawTexts.en).flatMap(([g, fields]) => Object.keys(fields).map((f) => `${g}.${f}`)).sort();
    expect(formKeys).toEqual(contentKeys);

    for (const group of textFields) {
      expect(group.i18n, `group ${group.name}`).toBe(true);
      for (const f of group.fields) {
        expect(f.i18n, `${group.name}.${f.name} must be translatable (i18n: true)`).toBe(true);
        expect(["string", "text"], `${group.name}.${f.name} widget`).toContain(f.widget);
      }
    }
  });

  test("the product form covers every product field; only name and description are translated", () => {
    const list = collectionFile("shop", "products").fields[0];
    expect(list.i18n, "the product list must be the same in every language").toBe("duplicate");
    const productFields = list.fields.map((f) => f.name).sort();
    const dataFields = [...new Set(rawProducts.en.products.flatMap((p) => Object.keys(p)))].sort();
    expect(productFields).toEqual(dataFields);
    const translated = list.fields.filter((f) => f.i18n === true).map((f) => f.name);
    expect(translated.sort()).toEqual(["description", "name"]);
  });

  test("the category form translates only the label", () => {
    const list = collectionFile("shop", "categories").fields[0];
    expect(list.i18n).toBe("duplicate");
    expect(list.fields.filter((f) => f.i18n === true).map((f) => f.name)).toEqual(["label"]);
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

test.describe("asset cache-busting", () => {
  // Guards against two real bugs: (1) css/style.css was edited many times while every
  // page kept requesting the same bare URL, so browsers kept serving an old cached copy;
  // (2) Cloudflare (in front of belfegor.shop) kept serving the old js/main.js after a
  // deploy while products.json (not cached) was already in the new format, so the shop
  // rendered empty. Every local stylesheet/script must carry ?v=<content hash> (via
  // `npm run assets:version`), so any change gets a new URL that no cache has seen.
  for (const file of HTML_PAGES) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    const localRefs = [...html.matchAll(/<(?:script\b[^>]*\bsrc|link\b[^>]*\bhref)="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((url) => !/^(?:https?:)?\/\//.test(url) && /\.(?:js|css)(?:\?|$)/.test(url));

    test(`${file} loads every local CSS/JS file with its current content-hash version`, () => {
      expect(localRefs.length).toBeGreaterThan(0);
      for (const url of localRefs) {
        const [asset] = url.split("?");
        expect(ASSETS, `${file}: ${asset} must be listed in ASSETS in scripts/update-asset-versions.js`).toContain(asset);
        expect(url, `${file}: run "npm run assets:version" after editing ${asset}`).toBe(`${asset}?v=${assetVersion(asset)}`);
      }
    });
  }

  test("every page loads the stylesheet", () => {
    for (const file of HTML_PAGES) {
      expect(fs.readFileSync(path.join(ROOT, file), "utf8")).toContain(`href="css/style.css?v=${assetVersion("css/style.css")}"`);
    }
  });
});

test.describe("merging per-language content (js/content.js mergeLocales)", () => {
  test("puts the languages at the leaves and keeps lists aligned", () => {
    const merged = mergeLocales({
      en: { hero: { title: "Shop" }, products: [{ name: "Ring", price: 5, images: ["media/a.webp"] }] },
      ru: { hero: { title: "Магазин" }, products: [{ name: "Кольцо", price: 5, images: ["media/a.webp"] }] },
    });
    expect(merged).toEqual({
      hero: { title: { en: "Shop", ru: "Магазин" } },
      products: [{ name: { en: "Ring", ru: "Кольцо" }, price: 5, images: ["media/a.webp"] }],
    });
  });

  test("values that are the same in every language stay plain", () => {
    expect(mergeLocales({ en: { brand: "Belfegor" }, pl: { brand: "Belfegor" } })).toEqual({ brand: "Belfegor" });
  });

  test("English defines the structure; fields only stored in English are kept", () => {
    const merged = mergeLocales({
      en: { items: [{ key: "A", label: "One" }] },
      ru: { items: [{ label: "Один" }, { label: "extra" }], unknown: "x" },
    });
    expect(merged).toEqual({ items: [{ key: "A", label: { en: "One", ru: "Один" } }] });
  });

  test("a missing or empty translation is left out or empty (the site falls back to English)", () => {
    expect(mergeLocales({ en: { t: "Hi" }, ru: { t: "Привет" }, pl: {} })).toEqual({ t: { en: "Hi", ru: "Привет" } });
    expect(mergeLocales({ en: { t: "Hi" }, ru: { t: "" } })).toEqual({ t: { en: "Hi", ru: "" } });
  });

  test("the real content files merge into the shape the site reads", () => {
    expect(products.length).toBe(rawProducts.en.products.length);
    expect(Object.keys(texts).sort()).toEqual(Object.keys(rawTexts.en).sort());
    expect(categories.map((c) => c.key)).toEqual(rawCategories.en.categories.map((c) => c.key));
  });
});
