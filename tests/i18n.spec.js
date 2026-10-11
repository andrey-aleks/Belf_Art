const { test, expect } = require("@playwright/test");
const { LANGS, products, categories, rawTexts, rawProducts, inLang, assetPath, text, gotoAndWait, waitForContent } = require("./helpers");

const categoryLabel = (key, lang) => inLang(categories.find((c) => c.key === key).label, lang);

// A products.json in the stored shape ({ en: { products }, ru: { products }, ... }) with
// the same list in every language.
const productsFile = (list) => Object.fromEntries(LANGS.map((lang) => [lang, { products: list }]));

test.describe("language switching", () => {
  test("defaults to English", async ({ page }) => {
    await gotoAndWait(page, "/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#lang-select")).toHaveValue("en");
    await expect(page.locator('.site-nav a[href="about.html"]')).toHaveText(text("nav.about"));
  });

  test("switching language translates static text, products, categories and the title", async ({ page }) => {
    await gotoAndWait(page, "/");
    await page.selectOption("#lang-select", "pl");

    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page.locator('.site-nav a[href="about.html"]')).toHaveText(text("nav.about", "pl"));
    await expect(page.locator(".hero-title")).toHaveText(text("hero.title", "pl"));
    await expect(page.locator(".product-name").first()).toHaveText(inLang(products[0].name, "pl"));
    await expect(page).toHaveTitle(text("title.shop", "pl"));
    await expect(page.locator(`.category-tile[data-category="${products[0].category}"]`)).toContainText(
      categoryLabel(products[0].category, "pl")
    );
  });

  test("switching back to English restores the English text", async ({ page }) => {
    await gotoAndWait(page, "/");
    await page.selectOption("#lang-select", "ru");
    await page.selectOption("#lang-select", "en");

    await expect(page.locator(".hero-title")).toHaveText(text("hero.title"));
    await expect(page.locator(".product-name").first()).toHaveText(inLang(products[0].name));
  });

  test("the header dropdown is the only language switcher", async ({ page }) => {
    for (const url of ["/index.html", "/about.html"]) {
      await gotoAndWait(page, url);
      await expect(page.locator(".lang-select")).toHaveCount(1);
      await expect(page.locator(".site-header .lang-select")).toHaveCount(1);
      await expect(page.locator(".lang-option, .hero-langs")).toHaveCount(0);
    }
  });

  test("the chosen language is remembered across pages", async ({ page }) => {
    await gotoAndWait(page, "/");
    await page.selectOption("#lang-select", "ru");
    await page.click('.site-nav a[href="contact.html"]');
    await waitForContent(page);

    await expect(page.locator("#lang-select")).toHaveValue("ru");
    await expect(page.locator(".section-title")).toContainText(text("contact.title", "ru"));
  });

  test("an open product modal is re-translated when the language changes", async ({ page }) => {
    await gotoAndWait(page, "/");
    await page.locator(".product-card").first().click();
    await page.evaluate(() => setLanguage("pl"));

    await expect(page.locator(".product-modal-title")).toHaveText(inLang(products[0].name, "pl"));
    await expect(page.locator(".product-modal-order")).toHaveText(text("product.order", "pl"));
  });

  test("filters keep working after a language change", async ({ page }) => {
    await gotoAndWait(page, "/");
    await page.selectOption("#lang-select", "pl");
    await page.locator(`.category-tile[data-category="${products[0].category}"]`).click();

    await expect(page.locator(".product-card")).toHaveCount(products.filter((p) => p.category === products[0].category).length);
  });

  test("a missing translation falls back to English", async ({ page }) => {
    await page.route("**/content/texts.json", (route) => {
      const copy = JSON.parse(JSON.stringify(rawTexts));
      delete copy.pl.hero.title;
      route.fulfill({ json: copy });
    });
    await gotoAndWait(page, "/");
    await page.selectOption("#lang-select", "pl");
    await expect(page.locator(".hero-title")).toHaveText(text("hero.title"));
  });

  test("an empty translation (not yet translated in the CMS) falls back to English", async ({ page }) => {
    await page.route("**/content/products.json", (route) => {
      const copy = JSON.parse(JSON.stringify(rawProducts));
      copy.pl.products[0].name = "";
      route.fulfill({ json: copy });
    });
    await gotoAndWait(page, "/");
    await page.selectOption("#lang-select", "pl");
    await expect(page.locator(".product-name").first()).toHaveText(inLang(products[0].name));
  });
});

test.describe("line breaks typed in the CMS", () => {
  // Regression guard: the editor wrote the Shipping page as several lines/paragraphs, but
  // the page showed it as one run-on line, because inserted text collapsed newlines.
  const SHIPPING_WITH_BREAKS = ["1. Where we ship", "Poland and Europe.", "", "2. Delivery", "DPD or InPost."].join("\n");
  const TWO_LINES = ["Line one", "Line two"].join("\n");

  test("a page text keeps its line breaks and blank lines", async ({ page }) => {
    await page.route("**/content/texts.json", (route) => {
      const copy = JSON.parse(JSON.stringify(rawTexts));
      copy.en.shipping.body = SHIPPING_WITH_BREAKS;
      route.fulfill({ json: copy });
    });
    await gotoAndWait(page, "/shipping.html");

    const p1 = page.locator('[data-i18n="shipping.body"]');
    // innerText reflects what's rendered: collapsed newlines would come back as spaces.
    expect(await p1.evaluate((el) => el.innerText)).toBe(SHIPPING_WITH_BREAKS);
    const lineHeight = await p1.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    const height = await p1.evaluate((el) => el.getBoundingClientRect().height);
    expect(height, "five lines (incl. the blank one) should be rendered").toBeGreaterThan(lineHeight * 4.5);
  });

  test("a product description keeps its line breaks in the detail window", async ({ page }) => {
    await page.route("**/content/products.json", (route) => {
      const copy = JSON.parse(JSON.stringify(rawProducts));
      for (const lang of Object.keys(copy)) copy[lang].products[0].description = TWO_LINES;
      route.fulfill({ json: copy });
    });
    await gotoAndWait(page, "/");
    await page.locator(".product-card").first().click();
    expect(await page.locator(".product-modal-description").evaluate((el) => el.innerText)).toBe(TWO_LINES);
  });

  test("texts without line breaks still wrap normally", async ({ page }) => {
    await gotoAndWait(page, "/");
    const box = await page.locator(".hero-title").boundingBox();
    expect(box.width).toBeLessThanOrEqual(page.viewportSize().width);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("edited content is shown and cannot inject HTML", () => {
  // The CMS editor is a different person than the developer; anything they type must be
  // displayed as text, never run as HTML/script.
  const payload = `<img src=x onerror="window.__xss=1">Evil & "quoted"`;

  test("a product name containing HTML is shown literally", async ({ page }) => {
    await page.route("**/content/products.json", (route) =>
      route.fulfill({
        json: productsFile([{ ...rawProducts.en.products[0], name: payload, category: `x"><b>y` }]),
      })
    );
    await gotoAndWait(page, "/");

    await expect(page.locator(".product-name")).toHaveText(payload);
    await expect(page.locator(".product-card img")).toHaveCount(1); // only the real photo
    await expect(page.locator(".category-strip b")).toHaveCount(0);
    await page.locator(".product-card").click();
    await expect(page.locator(".product-modal-title")).toHaveText(payload);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test("a page text containing HTML is shown literally", async ({ page }) => {
    await page.route("**/content/texts.json", (route) => {
      const copy = JSON.parse(JSON.stringify(rawTexts));
      copy.en.hero.title = payload;
      route.fulfill({ json: copy });
    });
    await gotoAndWait(page, "/");

    await expect(page.locator(".hero-title")).toHaveText(payload);
    await expect(page.locator(".hero-title img")).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test("a leading slash in a product photo path still loads on a sub-path site", async ({ page }) => {
    await page.route("**/content/products.json", (route) =>
      route.fulfill({ json: productsFile([{ ...rawProducts.en.products[0], images: ["/" + assetPath(products[0].images[0])] }]) })
    );
    await gotoAndWait(page, "/");
    const img = page.locator(".product-card .product-image");
    await expect(img).toHaveAttribute("src", /^media\//);
  });

  test("if products fail to load, a message is shown instead of an empty page", async ({ page }) => {
    await page.route("**/content/products.json", (route) => route.fulfill({ status: 500, body: "" }));
    await gotoAndWait(page, "/");
    await expect(page.locator(".filter-empty")).toHaveText(text("product.loadError"));
  });
});
