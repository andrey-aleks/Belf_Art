const { test, expect } = require("@playwright/test");

const PAGES = [
  { path: "/index.html", href: "index.html", label: "Shop" },
  { path: "/about.html", href: "about.html", label: "About" },
  { path: "/shipping.html", href: "shipping.html", label: "Shipping" },
];

const INSTAGRAM_PATTERN = /instagram\.com\/be1fegor_jewelry/;

for (const { path, label } of PAGES) {
  test.describe(`${label} page`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("has a nav with Shop, About, and Shipping links in order", async ({ page }) => {
      const links = page.locator(".site-nav a");
      await expect(links).toHaveCount(3);

      for (let i = 0; i < PAGES.length; i++) {
        await expect(links.nth(i)).toHaveText(PAGES[i].label);
        await expect(links.nth(i)).toHaveAttribute("href", PAGES[i].href);
      }
    });

    test("marks exactly this page as the current nav item", async ({ page }) => {
      const current = page.locator('.site-nav a[aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveText(label);
    });

    test("header shows a working Instagram link", async ({ page }) => {
      await expect(page.locator(".instagram-link")).toHaveAttribute("href", INSTAGRAM_PATTERN);
    });

    for (const target of PAGES) {
      if (target.href === PAGES.find((p) => p.path === path).href) continue;

      test(`nav link navigates to the ${target.label} page`, async ({ page }) => {
        await page.click(`.site-nav a[href="${target.href}"]`);
        await expect(page).toHaveURL(new RegExp(`${target.href.replace(".", "\\.")}$`));
        await expect(page.locator(".section-title")).toHaveText(new RegExp(target.label, "i"));
      });
    }
  });
}

test("About page has a heading, photo placeholder, and non-empty bio", async ({ page }) => {
  await page.goto("/about.html");
  await expect(page.locator(".section-title")).toHaveText(/about/i);
  await expect(page.locator(".about-photo")).toBeVisible();
  await expect(page.locator(".about-bio")).not.toBeEmpty();
});

test("Shipping page has a heading, mentions Poland, and links to Instagram", async ({ page }) => {
  await page.goto("/shipping.html");
  await expect(page.locator(".section-title")).toHaveText(/shipping/i);
  await expect(page.locator(".shipping-content")).toContainText(/poland/i);
  await expect(page.locator(".shipping-content a")).toHaveAttribute("href", INSTAGRAM_PATTERN);
});
