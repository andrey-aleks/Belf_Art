const { test, expect } = require("@playwright/test");

const PAGES = [
  { path: "/index.html", name: "shop" },
  { path: "/about.html", name: "about" },
  { path: "/custom-orders.html", name: "custom-orders" },
  { path: "/shipping.html", name: "shipping" },
  { path: "/contact.html", name: "contact" },
];

for (const { path, name } of PAGES) {
  test(`${name} page matches visual baseline`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
