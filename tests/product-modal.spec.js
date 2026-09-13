const { test, expect } = require("@playwright/test");
const { products } = require("../js/data.js");

const INSTAGRAM_PATTERN = /instagram\.com\/be1fegor_jewelry/;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("modal is hidden on page load", async ({ page }) => {
  await expect(page.locator("#product-modal")).toBeHidden();
});

test("modal image is significantly larger than the grid card image", async ({ page }) => {
  // Regression guard: the modal's photo once ended up barely bigger than the grid
  // thumbnail (and, briefly while fixing that on desktop, actually SMALLER on mobile
  // once modal padding ate too much of a small viewport). On wide viewports the modal
  // should be dramatically bigger; on narrow ones, where the card is already
  // near-full-width, "much bigger" isn't geometrically possible, so it should at least
  // never be smaller than the card.
  const viewport = page.viewportSize();

  const cardImageWidth = await page
    .locator(".product-card")
    .first()
    .locator(".product-image")
    .evaluate((el) => el.getBoundingClientRect().width);

  await page.locator(".product-card").first().click();

  const modalImageWidth = await page.locator(".product-modal-image").evaluate((el) => el.getBoundingClientRect().width);

  if (viewport.width < 600) {
    expect(modalImageWidth, "modal image should be at least as wide as the grid card image").toBeGreaterThanOrEqual(
      cardImageWidth
    );
  } else {
    expect(modalImageWidth, "modal image should be at least 40% wider than the grid card image").toBeGreaterThan(
      cardImageWidth * 1.4
    );
  }
});

test("clicking a product card opens the modal with that product's details", async ({ page }) => {
  const product = products[0];
  await page.locator(".product-card").first().click();

  const modal = page.locator("#product-modal");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".product-modal-title")).toHaveText(product.name);
  await expect(modal.locator(".product-modal-price")).toHaveText(product.price);
  await expect(modal.locator(".product-modal-description")).toHaveText(product.description);
  await expect(modal.locator(".product-modal-image")).toHaveAttribute("src", product.images[0]);
  await expect(modal.locator(".product-modal-order")).toHaveAttribute("href", INSTAGRAM_PATTERN);
});

test("opening a different card after closing shows fresh content, not stale data", async ({ page }) => {
  const cards = page.locator(".product-card");
  const modal = page.locator("#product-modal");

  await cards.nth(0).click();
  await expect(modal.locator(".product-modal-title")).toHaveText(products[0].name);
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();

  await cards.nth(1).click();
  await expect(modal.locator(".product-modal-title")).toHaveText(products[1].name);
  await expect(modal.locator(".product-modal-title")).toHaveCount(1);
});

test("closing via the close button hides the modal", async ({ page }) => {
  await page.locator(".product-card").first().click();
  await page.locator(".product-modal-close").click();
  await expect(page.locator("#product-modal")).toBeHidden();
});

test("closing via Escape hides the modal", async ({ page }) => {
  await page.locator(".product-card").first().click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#product-modal")).toBeHidden();
});

test("closing via the backdrop hides the modal", async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(
    viewport.width < 720,
    "the modal is intentionally fullscreen with no visible backdrop on narrow viewports (close via the button or Escape instead — the standard pattern for fullscreen mobile sheets)"
  );

  await page.locator(".product-card").first().click();
  await page.locator(".product-modal-backdrop").click({ position: { x: 5, y: 5 } });
  await expect(page.locator("#product-modal")).toBeHidden();
});

test("closing the modal returns focus to the card that opened it", async ({ page }) => {
  const firstCard = page.locator(".product-card").first();
  await firstCard.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#product-modal")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("#product-modal")).toBeHidden();
  await expect(firstCard).toBeFocused();
});

test("keyboard: focusing a card and pressing Enter opens its modal", async ({ page }) => {
  const card = page.locator(".product-card").nth(2);
  await card.focus();
  await page.keyboard.press("Enter");

  const modal = page.locator("#product-modal");
  await expect(modal).toBeVisible();
  await expect(modal.locator(".product-modal-title")).toHaveText(products[2].name);
});

test("clicking the modal's Order button does not close the modal", async ({ page, context }) => {
  await page.locator(".product-card").first().click();

  const [popup] = await Promise.all([context.waitForEvent("page"), page.locator(".product-modal-order").click()]);
  await popup.close();
  await expect(page.locator("#product-modal")).toBeVisible();
});

test("a product with a single image shows no thumbnail row", async ({ page }) => {
  await page.locator(".product-card").first().click();
  await expect(page.locator(".product-modal-thumb")).toHaveCount(0);
});

test("a product with multiple images shows thumbnails that switch the main photo", async ({ page }) => {
  await page.evaluate(() => {
    window.openModal({
      id: 999,
      name: "Test Multi-Image Product",
      price: "1 EUR",
      description: "A product with more than one photo.",
      images: ["media/web/1000030969-01.jpg", "media/web/IMG_20260908_151912-01.jpg"],
    });
  });

  const mainImage = page.locator(".product-modal-image");
  await expect(mainImage).toHaveAttribute("src", /1000030969-01\.jpg/);

  const thumbs = page.locator(".product-modal-thumb");
  await expect(thumbs).toHaveCount(2);

  await thumbs.nth(1).click();
  await expect(mainImage).toHaveAttribute("src", /IMG_20260908_151912-01\.jpg/);
});
