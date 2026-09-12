const { test, expect } = require("@playwright/test");

test("homepage matches visual baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png", { fullPage: true });
});
