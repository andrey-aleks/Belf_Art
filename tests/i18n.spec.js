const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { TRANSLATIONS, LANGUAGES, DEFAULT_LANGUAGE } = require("../js/i18n.js");
const { products } = require("../js/data.js");
const { PAGES: HTML_PAGES } = require("../scripts/update-css-version.js");

const ROOT = path.join(__dirname, "..");
const OTHER_LANGUAGES = LANGUAGES.filter((l) => l !== DEFAULT_LANGUAGE);

test.describe("translation dictionaries", () => {
  // English page text lives in the HTML, so every key used there must exist in each
  // non-English dictionary — otherwise that string silently stays English.
  const htmlKeys = new Set();
  for (const file of HTML_PAGES) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const m of html.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)) htmlKeys.add(m[1]);
  }
  const jsKeys = Object.keys(TRANSLATIONS[DEFAULT_LANGUAGE]);

  for (const lang of OTHER_LANGUAGES) {
    test(`${lang} has every key used in the HTML pages and in JS`, () => {
      const missing = [...htmlKeys, ...jsKeys].filter((k) => !(k in TRANSLATIONS[lang]));
      expect(missing).toEqual([]);
    });

    test(`${lang} translates every product and category`, () => {
      for (const p of products) {
        expect(p.translations && p.translations[lang], `${lang} translation of "${p.name}"`).toBeTruthy();
        expect(TRANSLATIONS[lang][`category.${p.category}`], `${lang} label for category ${p.category}`).toBeTruthy();
      }
    });
  }

  test("English has a plural label for every category", () => {
    for (const p of products) {
      expect(TRANSLATIONS.en[`category.${p.category}`]).toBeTruthy();
    }
  });
});

test.describe("language switching", () => {
  test("defaults to English", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#lang-select")).toHaveValue("en");
    await expect(page.locator('.site-nav a[href="about.html"]')).toHaveText("About");
  });

  test("switching language translates static text, products, and the title", async ({ page }) => {
    await page.goto("/");
    await page.selectOption("#lang-select", "pl");

    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page.locator('.site-nav a[href="about.html"]')).toHaveText(TRANSLATIONS.pl["nav.about"]);
    await expect(page.locator(".hero-title")).toHaveText(TRANSLATIONS.pl["hero.title"]);
    await expect(page.locator(".product-name").first()).toHaveText(products[0].translations.pl.name);
    await expect(page).toHaveTitle(TRANSLATIONS.pl["title.shop"]);
    await expect(page.locator(`.category-tile[data-category="${products[0].category}"]`)).toContainText(
      TRANSLATIONS.pl[`category.${products[0].category}`]
    );
  });

  test("switching back to English restores the original text", async ({ page }) => {
    await page.goto("/");
    await page.selectOption("#lang-select", "ru");
    await page.selectOption("#lang-select", "en");

    await expect(page.locator(".hero-title")).toHaveText(/handmade jewelry for those who feel too much/i);
    await expect(page.locator(".product-name").first()).toHaveText(products[0].name);
  });

  test("the hero language buttons switch language too", async ({ page }) => {
    await page.goto("/");
    await page.locator('.lang-option[data-lang="uk"]').click();

    await expect(page.locator("#lang-select")).toHaveValue("uk");
    await expect(page.locator('.lang-option[data-lang="uk"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".hero-cta")).toHaveText(TRANSLATIONS.uk["hero.cta"]);
  });

  test("the chosen language is remembered across pages", async ({ page }) => {
    await page.goto("/");
    await page.selectOption("#lang-select", "ru");
    await page.click('.site-nav a[href="contact.html"]');

    await expect(page.locator("#lang-select")).toHaveValue("ru");
    await expect(page.locator(".section-title")).toContainText(TRANSLATIONS.ru["contact.title"]);
  });

  test("an open product modal is re-translated when the language changes", async ({ page }) => {
    await page.goto("/");
    await page.locator(".product-card").first().click();
    await page.evaluate(() => setLanguage("pl"));

    await expect(page.locator(".product-modal-title")).toHaveText(products[0].translations.pl.name);
    await expect(page.locator(".product-modal-order")).toHaveText(TRANSLATIONS.pl["product.order"]);
  });

  test("filters keep working after a language change", async ({ page }) => {
    await page.goto("/");
    await page.selectOption("#lang-select", "pl");
    await page.locator(`.category-tile[data-category="${products[0].category}"]`).click();

    await expect(page.locator(".product-card")).toHaveCount(products.filter((p) => p.category === products[0].category).length);
  });
});
