const { test, expect } = require("@playwright/test");
const { gotoAndWait } = require("./helpers");

const PAGES = [
  { path: "/index.html", name: "shop" },
  { path: "/about.html", name: "about" },
  { path: "/custom-orders.html", name: "custom-orders" },
  { path: "/shipping.html", name: "shipping" },
  { path: "/contact.html", name: "contact" },
];

for (const { path, name } of PAGES) {
  test(`${name} page matches visual baseline`, async ({ page }) => {
    await gotoAndWait(page, path);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
