const { test, expect } = require("@playwright/test");
const { products, categories, gotoAndWait } = require("./helpers");

test.beforeEach(async ({ page }) => {
  await gotoAndWait(page, "/");
});

test("all products are shown by default", async ({ page }) => {
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

test("a category tile exists for every distinct category in the data, none active by default", async ({ page }) => {
  const categories = [...new Set(products.map((p) => p.category))];
  await expect(page.locator(".category-tile")).toHaveCount(categories.length);

  for (const category of categories) {
    await expect(page.locator(`.category-tile[data-category="${category}"]`)).toHaveAttribute("aria-pressed", "false");
  }
});

test("category tiles follow the order of content/categories.json and show its labels", async ({ page }) => {
  const used = new Set(products.map((p) => p.category));
  const expected = categories.filter((c) => used.has(c.key));
  await expect(page.locator(".category-tile")).toHaveCount(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const tile = page.locator(".category-tile").nth(i);
    await expect(tile).toHaveAttribute("data-category", expected[i].key);
    await expect(tile.locator(".category-label")).toHaveText(expected[i].label.en);
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
    await expect(page.locator(".product-card", { hasText: p.name })).toHaveCount(0);
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
  expect(names.map((n) => n.trim())).toEqual(products.map((p) => p.name.en));
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

  test("shows a Sold Out badge on the card image", async ({ page }) => {
    await page.evaluate((product) => window.renderProducts([product]), soldOutProduct);

    const card = page.locator(".product-card");
    await expect(card.locator(".sold-out-badge")).toHaveText(/sold out/i);
    await expect(card.locator(".order-button")).toHaveCount(0);
  });

  test("the modal shows a disabled order control for a sold-out product", async ({ page }) => {
    await page.evaluate((product) => window.openModal(product), soldOutProduct);

    const modal = page.locator("#product-modal");
    await expect(modal).toBeVisible();
    const modalOrder = modal.locator(".product-modal-order");
    await expect(modalOrder).toHaveText(/sold out/i);
    await expect(modalOrder).toHaveAttribute("aria-disabled", "true");
    await expect(modalOrder).not.toHaveAttribute("href", /.+/);
  });

  test("an in-stock product does not show a Sold Out badge", async ({ page }) => {
    await page.evaluate((product) => window.renderProducts([{ ...product, soldOut: false }]), soldOutProduct);
    await expect(page.locator(".product-card .sold-out-badge")).toHaveCount(0);
  });

  test("the badges in the real catalog match each product's soldOut flag", async ({ page }) => {
    await expect(page.locator(".product-card .sold-out-badge")).toHaveCount(products.filter((p) => p.soldOut).length);
  });
});
