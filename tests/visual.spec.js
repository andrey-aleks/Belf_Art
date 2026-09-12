const { test, expect } = require("@playwright/test");

const PAGES = [
  { path: "/index.html", name: "shop" },
  { path: "/about.html", name: "about" },
  { path: "/shipping.html", name: "shipping" },
];

for (const { path, name } of PAGES) {
  test(`${name} page matches visual baseline`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
