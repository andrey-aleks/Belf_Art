const { test, expect } = require("@playwright/test");
const { products, categories, inLang, text, gotoAndWait, rawTexts } = require("./helpers");

test.beforeEach(async ({ page }) => {
  await gotoAndWait(page, "/");
});

test("all products are shown by default", async ({ page }) => {
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

const CATEGORY_TILES = '.category-tile:not(.category-tile-all)';

test("a category tile exists for every distinct category in the data, none active by default", async ({ page }) => {
  const categories = [...new Set(products.map((p) => p.category))];
  await expect(page.locator(CATEGORY_TILES)).toHaveCount(categories.length);

  for (const category of categories) {
    await expect(page.locator(`.category-tile[data-category="${category}"]`)).toHaveAttribute("aria-pressed", "false");
  }
});

test("an \"All\" tile comes first and is selected by default", async ({ page }) => {
  const all = page.locator(".category-tile").first();
  await expect(all).toHaveClass(/category-tile-all/);
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(all.locator(".category-label")).toHaveText(text("categories.all"));
  await expect(page.locator('.category-tile[aria-pressed="true"]')).toHaveCount(1);
});

test("clicking \"All\" after picking a category shows every product again", async ({ page }) => {
  // Regression guard: once a category was picked there was no visible way back to the
  // full list (only re-clicking the same tile, which nobody discovered) short of reloading.
  const all = page.locator(".category-tile-all");
  const tile = page.locator(`.category-tile[data-category="${products[0].category}"]`);

  await tile.click();
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".product-card")).toHaveCount(products.filter((p) => p.category === products[0].category).length);

  await all.click();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(tile).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

test("clicking \"All\" keeps the availability filter", async ({ page }) => {
  await page.selectOption("#filter-availability", "in-stock");
  await page.locator(`.category-tile[data-category="${products[0].category}"]`).click();
  await page.locator(".category-tile-all").click();
  await expect(page.locator(".product-card")).toHaveCount(products.filter((p) => !p.soldOut).length);
});

test("the \"All\" tile is translated", async ({ page }) => {
  await page.selectOption("#lang-select", "pl");
  await expect(page.locator(".category-tile-all .category-label")).toHaveText(text("categories.all", "pl"));
});

test("category tiles follow the order of content/categories.json and show its labels", async ({ page }) => {
  const used = new Set(products.map((p) => p.category));
  const expected = categories.filter((c) => used.has(c.key));
  await expect(page.locator(CATEGORY_TILES)).toHaveCount(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const tile = page.locator(CATEGORY_TILES).nth(i);
    await expect(tile).toHaveAttribute("data-category", expected[i].key);
    await expect(tile.locator(".category-label")).toHaveText(inLang(expected[i].label));
  }
});

test("a category with no products gets no tile", async ({ page }) => {
  const unused = categories.filter((c) => !products.some((p) => p.category === c.key));
  for (const c of unused) {
    await expect(page.locator(`.category-tile[data-category="${c.key}"]`)).toHaveCount(0);
  }
});

test("every category tile image loads", async ({ page }) => {
  const broken = await page
    .locator(".category-image")
    .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode().then(() => null).catch(() => img.src))));
  expect(broken.filter(Boolean)).toEqual([]);
});

test("clicking a category tile shows only that category's products", async ({ page }) => {
  const firstCategory = products[0].category;
  const expected = products.filter((p) => p.category === firstCategory);

  const tile = page.locator(`.category-tile[data-category="${firstCategory}"]`);
  await tile.click();

  await expect(tile).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".product-card")).toHaveCount(expected.length);
  for (const p of products.filter((p) => p.category !== firstCategory)) {
    await expect(page.locator(".product-card", { hasText: inLang(p.name) })).toHaveCount(0);
  }
});

test("clicking another tile switches the category", async ({ page }) => {
  const categories = [...new Set(products.map((p) => p.category))];
  test.skip(categories.length < 2, "requires at least two categories");

  await page.locator(`.category-tile[data-category="${categories[0]}"]`).click();
  await page.locator(`.category-tile[data-category="${categories[1]}"]`).click();

  await expect(page.locator('.category-tile[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator(".product-card")).toHaveCount(products.filter((p) => p.category === categories[1]).length);
});

test("clicking the active tile again restores all products", async ({ page }) => {
  const tile = page.locator(`.category-tile[data-category="${products[0].category}"]`);

  await tile.click();
  await expect(page.locator(".product-card")).not.toHaveCount(products.length);

  await tile.click();
  await expect(tile).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".category-tile-all")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

test("availability filter: In stock hides sold-out products, Sold out hides in-stock ones", async ({ page }) => {
  await page.selectOption("#filter-availability", "in-stock");
  await expect(page.locator(".product-card")).toHaveCount(products.filter((p) => !p.soldOut).length);

  await page.selectOption("#filter-availability", "out-of-stock");
  const soldOutCount = products.filter((p) => p.soldOut).length;
  if (soldOutCount === 0) {
    await expect(page.locator(".filter-empty")).toBeVisible();
  } else {
    await expect(page.locator(".product-card")).toHaveCount(soldOutCount);
  }

  await page.selectOption("#filter-availability", "all");
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

test("sorting by price low to high orders cards by ascending price", async ({ page }) => {
  await page.selectOption("#sort-select", "price-asc");

  const prices = await page.locator(".product-price").allTextContents();
  const numeric = prices.map((p) => parseFloat(p));
  const sorted = [...numeric].sort((a, b) => a - b);
  expect(numeric).toEqual(sorted);
});

test("sorting by price high to low orders cards by descending price", async ({ page }) => {
  await page.selectOption("#sort-select", "price-desc");

  const prices = await page.locator(".product-price").allTextContents();
  const numeric = prices.map((p) => parseFloat(p));
  const sorted = [...numeric].sort((a, b) => b - a);
  expect(numeric).toEqual(sorted);
});

test("sorting by name A-Z orders cards alphabetically", async ({ page }) => {
  await page.selectOption("#sort-select", "name-asc");

  const names = await page.locator(".product-name").allTextContents();
  const trimmed = names.map((n) => n.trim());
  const sorted = [...trimmed].sort((a, b) => a.localeCompare(b));
  expect(trimmed).toEqual(sorted);
});

test("choosing Most relevant restores the original catalog order", async ({ page }) => {
  await page.selectOption("#sort-select", "name-asc");
  await page.selectOption("#sort-select", "relevant");

  const names = await page.locator(".product-name").allTextContents();
  expect(names.map((n) => n.trim())).toEqual(products.map((p) => inLang(p.name)));
});

test("a filter combination with no matches shows an empty-state message", async ({ page }) => {
  await page.evaluate(() => window.renderProducts([]));

  await expect(page.locator(".product-card")).toHaveCount(0);
  await expect(page.locator(".filter-empty")).toBeVisible();
});

test.describe("sold-out product rendering", () => {
  const soldOutProduct = {
    name: { en: "Test Sold Out Item" },
    price: 99,
    images: ["media/web/1000030969-01.jpg"],
    description: { en: "A test product used to verify sold-out rendering." },
    category: "Necklace",
    soldOut: true,
  };
  // The note as rendered: the CMS text with its {link} placeholder replaced by the link text.
  const expectedNote = (lang = "en") => text("product.soldOutNote", lang).replace("{link}", text("product.soldOutLink", lang));

  test("a sold-out card shows the SOLD OUT pill and the note between the name and the price", async ({ page }) => {
    await page.evaluate((product) => window.renderProducts([product]), soldOutProduct);
    const card = page.locator(".product-card");

    await expect(card).toHaveClass(/is-sold-out/);
    await expect(card.locator(".sold-out-badge")).toHaveText(new RegExp(text("product.soldOut"), "i"));
    await expect(card.locator(".product-image-wrap .sold-out-badge"), "the pill is no longer on the photo").toHaveCount(0);
    await expect(card.locator(".sold-out-note")).toHaveText(expectedNote());
    await expect(card.locator(".product-price")).toHaveText("99 EUR");
    await expect(card.locator(".order-button")).toHaveCount(0);

    const y = async (sel) => (await card.locator(sel).boundingBox()).y;
    expect(await y(".product-name")).toBeLessThan(await y(".sold-out-badge"));
    expect(await y(".sold-out-badge")).toBeLessThan(await y(".sold-out-note"));
    expect(await y(".sold-out-note")).toBeLessThan(await y(".product-price"));
  });

  test("the note's link goes to the Custom Orders page without opening the detail window", async ({ page }) => {
    await page.evaluate((product) => window.renderProducts([product]), soldOutProduct);
    const link = page.locator(".product-card .sold-out-link");
    await expect(link).toHaveText(text("product.soldOutLink"));
    await expect(link).toHaveAttribute("href", "custom-orders.html");

    await link.click();
    await expect(page).toHaveURL(/custom-orders\.html$/);
  });

  test("pressing Enter on the note's link follows it instead of opening the detail window", async ({ page }) => {
    await page.evaluate((product) => window.renderProducts([product]), soldOutProduct);
    await page.locator(".product-card .sold-out-link").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/custom-orders\.html$/);
  });

  test("the detail window shows the pill and note, keeps the price, and has no Order button", async ({ page }) => {
    await page.evaluate((product) => window.openModal(product), soldOutProduct);

    const modal = page.locator("#product-modal");
    await expect(modal).toBeVisible();
    await expect(modal.locator(".product-modal-sold-out")).toBeVisible();
    await expect(modal.locator(".sold-out-badge")).toHaveText(new RegExp(text("product.soldOut"), "i"));
    await expect(modal.locator(".sold-out-note")).toHaveText(expectedNote());
    await expect(modal.locator(".sold-out-link")).toHaveAttribute("href", "custom-orders.html");
    await expect(modal.locator(".product-modal-price")).toHaveText("99 EUR");
    await expect(modal.locator(".product-modal-order"), "no button for a sold-out item").toBeHidden();
  });

  test("after a sold-out item, an in-stock item's detail window shows the Order button again", async ({ page }) => {
    await page.evaluate((product) => window.openModal(product), soldOutProduct);
    await page.keyboard.press("Escape");
    await page.evaluate((product) => window.openModal({ ...product, soldOut: false }), soldOutProduct);

    const modal = page.locator("#product-modal");
    await expect(modal.locator(".product-modal-sold-out")).toBeHidden();
    await expect(modal.locator(".product-modal-order")).toBeVisible();
    await expect(modal.locator(".product-modal-order")).toHaveAttribute("href", /instagram\.com/);
  });

  test("an in-stock product shows no pill or note", async ({ page }) => {
    await page.evaluate((product) => window.renderProducts([{ ...product, soldOut: false }]), soldOutProduct);
    await expect(page.locator(".product-card .sold-out-badge")).toHaveCount(0);
    await expect(page.locator(".product-card .sold-out-note")).toHaveCount(0);
  });

  test("the pill and note are translated", async ({ page }) => {
    await page.selectOption("#lang-select", "pl");
    await page.evaluate((product) => window.renderProducts([product]), soldOutProduct);
    await expect(page.locator(".product-card .sold-out-badge")).toHaveText(new RegExp(text("product.soldOut", "pl"), "i"));
    await expect(page.locator(".product-card .sold-out-note")).toHaveText(expectedNote("pl"));
  });

  test("HTML typed into the note text is shown literally", async ({ page }) => {
    await page.route("**/content/texts.json", (route) => {
      const copy = JSON.parse(JSON.stringify(rawTexts));
      copy.en.product.soldOutNote = '<img src=x onerror="window.__xss=1">Gone, {link}';
      copy.en.product.soldOutLink = "<b>custom</b>";
      route.fulfill({ json: copy });
    });
    await gotoAndWait(page, "/");
    await page.evaluate((product) => window.renderProducts([product]), soldOutProduct);

    const note = page.locator(".product-card .sold-out-note");
    await expect(note).toHaveText('<img src=x onerror="window.__xss=1">Gone, <b>custom</b>');
    await expect(note.locator("img, b")).toHaveCount(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });

  test("the cards in the real catalog match each product's soldOut flag", async ({ page }) => {
    await expect(page.locator(".product-card .sold-out-badge")).toHaveCount(products.filter((p) => p.soldOut).length);
  });
});
