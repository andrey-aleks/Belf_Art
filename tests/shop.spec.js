const { test, expect } = require("@playwright/test");
const { products } = require("../js/data.js");

const INSTAGRAM_PATTERN = /instagram\.com\/be1fegor_jewelry/;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("page has the expected title", async ({ page }) => {
  await expect(page).toHaveTitle(/Belf Art/i);
});

test("header shows the shop name and a working Instagram link", async ({ page }) => {
  await expect(page.locator(".site-title")).toHaveText(/Belf Art/i);
  await expect(page.locator(".instagram-link")).toHaveAttribute("href", INSTAGRAM_PATTERN);
});

test("renders exactly one card per product", async ({ page }) => {
  await expect(page.locator(".product-card")).toHaveCount(products.length);
});

test("every card shows an image, name, and price, with no order button (ordering happens in the detail modal)", async ({ page }) => {
  const cards = page.locator(".product-card");
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    await expect(card.locator(".product-image")).toBeVisible();
    await expect(card.locator(".product-name")).not.toBeEmpty();
    await expect(card.locator(".product-price")).not.toBeEmpty();
    await expect(card.locator(".order-button")).toHaveCount(0);
  }
});

test("no product image is broken", async ({ page }) => {
  const brokenSrcs = await page
    .locator(".product-image")
    .evaluateAll((imgs) => imgs.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src));

  expect(brokenSrcs).toEqual([]);
});

test("no failed network requests for page assets", async ({ page }) => {
  const failed = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });

  await page.reload();
  expect(failed).toEqual([]);
});

test("product grid is uniform and never overflows the viewport", async ({ page }) => {
  const viewport = page.viewportSize();

  const boxes = await page.locator(".product-card").evaluateAll((els) =>
    els.map((el) => {
      const rect = el.getBoundingClientRect();
      return { x: Math.round(rect.x), width: Math.round(rect.width) };
    })
  );

  const widths = new Set(boxes.map((b) => b.width));
  expect(widths.size, "all product cards should share the same width").toBe(1);

  const columns = new Set(boxes.map((b) => b.x)).size;
  if (viewport.width < 480) {
    expect(columns, "narrow viewports should show a single column").toBe(1);
  } else {
    expect(columns, "wide viewports should show multiple columns").toBeGreaterThan(1);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(1);
});

test("shop layout expands to use available width on wide viewports, not capped like other pages", async ({ page }) => {
  // Regression guard: the Shop layout used to inherit .section's 1300px max-width like
  // every other page, leaving large empty margins on wide screens instead of filling
  // available space the way the reference site does.
  await page.setViewportSize({ width: 1800, height: 1000 });

  const width = await page.locator(".shop-layout").evaluate((el) => el.getBoundingClientRect().width);
  expect(width, "shop layout should expand well past the old 1300px page cap on wide screens").toBeGreaterThan(1500);
});

test("product price sits at the same offset in every card, regardless of name length", async ({ page }) => {
  const offsets = await page.locator(".product-card").evaluateAll((cards) =>
    cards.map((card) => {
      const cardRect = card.getBoundingClientRect();
      const priceRect = card.querySelector(".product-price").getBoundingClientRect();
      return Math.round((priceRect.top - cardRect.top) * 100) / 100;
    })
  );

  expect(offsets.length).toBeGreaterThan(1);

  const [first, ...rest] = offsets;
  for (const offset of rest) {
    expect(Math.abs(offset - first), "price should be the same distance from its card's top on every card").toBeLessThanOrEqual(1);
  }
});
