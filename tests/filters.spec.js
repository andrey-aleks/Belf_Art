const { test, expect } = require("@playwright/test");
const { products } = require("../js/data.js");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("all products are shown by default", async ({ page }) => {
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

test("a category checkbox exists for every distinct category in the data, all checked", async ({ page }) => {
  const categories = [...new Set(products.map((p) => p.category))];
  const checkboxes = page.locator(".filter-category");
  await expect(checkboxes).toHaveCount(categories.length);

  for (const category of categories) {
    const checkbox = page.locator(`.filter-category[value="${category}"]`);
    await expect(checkbox).toBeChecked();
  }
});

test("unchecking a category hides only that category's products", async ({ page }) => {
  const firstCategory = products[0].category;
  const expectedRemaining = products.filter((p) => p.category !== firstCategory).length;

  await page.locator(`.filter-category[value="${firstCategory}"]`).uncheck();

  await expect(page.locator(".product-card")).toHaveCount(expectedRemaining);
  for (const p of products.filter((p) => p.category === firstCategory)) {
    await expect(page.locator(".product-card", { hasText: p.name })).toHaveCount(0);
  }
});

test("unchecking In stock hides all in-stock products when none are sold out", async ({ page }) => {
  test.skip(
    products.every((p) => p.soldOut),
    "requires at least one in-stock product in the current catalog"
  );

  await page.locator('.filter-availability[value="in-stock"]').uncheck();

  const expectedRemaining = products.filter((p) => p.soldOut).length;
  await expect(page.locator(".product-card")).toHaveCount(expectedRemaining);
});

test("re-checking a filter restores the hidden products", async ({ page }) => {
  const firstCategory = products[0].category;
  const checkbox = page.locator(`.filter-category[value="${firstCategory}"]`);

  await checkbox.uncheck();
  await expect(page.locator(".product-card")).not.toHaveCount(products.length);

  await checkbox.check();
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

test("sorting by price low to high orders cards by ascending price", async ({ page }) => {
  await page.locator('.filter-sort[value="price-asc"]').check();

  const prices = await page.locator(".product-price").allTextContents();
  const numeric = prices.map((p) => parseFloat(p));
  const sorted = [...numeric].sort((a, b) => a - b);
  expect(numeric).toEqual(sorted);
});

test("sorting by price high to low orders cards by descending price", async ({ page }) => {
  await page.locator('.filter-sort[value="price-desc"]').check();

  const prices = await page.locator(".product-price").allTextContents();
  const numeric = prices.map((p) => parseFloat(p));
  const sorted = [...numeric].sort((a, b) => b - a);
  expect(numeric).toEqual(sorted);
});

test("sorting by name A-Z orders cards alphabetically", async ({ page }) => {
  await page.locator('.filter-sort[value="name-asc"]').check();

  const names = await page.locator(".product-name").allTextContents();
  const trimmed = names.map((n) => n.trim());
  const sorted = [...trimmed].sort((a, b) => a.localeCompare(b));
  expect(trimmed).toEqual(sorted);
});

test("choosing Most relevant restores the original catalog order", async ({ page }) => {
  await page.locator('.filter-sort[value="name-asc"]').check();
  await page.locator('.filter-sort[value="relevant"]').check();

  const names = await page.locator(".product-name").allTextContents();
  expect(names.map((n) => n.trim())).toEqual(products.map((p) => p.name));
});

test("filtering out every category shows an empty-state message", async ({ page }) => {
  for (const checkbox of await page.locator(".filter-category").all()) {
    await checkbox.uncheck();
  }

  await expect(page.locator(".product-card")).toHaveCount(0);
  await expect(page.locator(".filter-empty")).toBeVisible();
});

test.describe("sold-out product rendering", () => {
  const soldOutProduct = {
    id: 999,
    name: "Test Sold Out Item",
    price: "99 EUR",
    image: "media/web/1000030969-01.jpg",
    images: ["media/web/1000030969-01.jpg"],
    description: "A test product used to verify sold-out rendering.",
    category: "Necklace",
    soldOut: true,
  };

  test("shows a Sold Out badge and a disabled, non-navigating order control", async ({ page }) => {
    await page.evaluate((product) => window.renderProducts([product]), soldOutProduct);

    const card = page.locator(".product-card");
    await expect(card.locator(".sold-out-badge")).toHaveText(/sold out/i);

    const orderControl = card.locator(".order-button");
    await expect(orderControl).toHaveText(/sold out/i);
    await expect(orderControl).toHaveAttribute("aria-disabled", "true");
    expect(await orderControl.evaluate((el) => el.tagName)).toBe("SPAN");
  });

  test("the modal also shows a disabled order control for a sold-out product", async ({ page }) => {
    await page.evaluate((product) => window.openModal(product), soldOutProduct);

    const modal = page.locator("#product-modal");
    await expect(modal).toBeVisible();
    const modalOrder = modal.locator(".product-modal-order");
    await expect(modalOrder).toHaveText(/sold out/i);
    await expect(modalOrder).toHaveAttribute("aria-disabled", "true");
    await expect(modalOrder).not.toHaveAttribute("href", /.+/);
  });

  test("an in-stock product does not show a badge or disabled control", async ({ page }) => {
    const card = page.locator(".product-card").first();
    await expect(card.locator(".sold-out-badge")).toHaveCount(0);
    await expect(card.locator(".order-button")).not.toHaveAttribute("aria-disabled", "true");
  });
});
