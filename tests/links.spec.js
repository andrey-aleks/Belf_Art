const { test, expect } = require("@playwright/test");
const { links, gotoAndWait } = require("./helpers");

// Shop links are edited in the CMS (content/links.json → "Site → Shop links") and applied
// by js/content.js to every element marked data-link / data-link-handle /
// data-link-optional.

const EDITED = {
  instagram: "https://www.instagram.com/new_shop_name/",
  telegram: "https://t.me/new_shop_tg",
  vinted: "https://www.vinted.pl/member/999-newvinted",
  email: "hello@example.com",
};

function serveLinks(page, json) {
  return page.route("**/content/links.json", (route) => route.fulfill({ json }));
}

test.describe("links edited in the CMS are used everywhere", () => {
  test("footer and Contact page use the edited links and handles", async ({ page }) => {
    await serveLinks(page, EDITED);
    await gotoAndWait(page, "/contact.html");

    for (const kind of ["instagram", "telegram", "vinted"]) {
      for (const el of await page.locator(`[data-link="${kind}"]`).all()) {
        await expect(el).toHaveAttribute("href", EDITED[kind]);
      }
    }
    await expect(page.locator('[data-link-handle="instagram"]')).toHaveText("@new_shop_name");
    await expect(page.locator('[data-link-handle="telegram"]')).toHaveText("@new_shop_tg");
    await expect(page.locator('[data-link-handle="vinted"]')).toHaveText("newvinted");
  });

  test("every Instagram button follows the edited link", async ({ page }) => {
    await serveLinks(page, EDITED);

    await gotoAndWait(page, "/custom-orders.html");
    await expect(page.locator('.custom-cta-wrap [data-link="instagram"]')).toHaveAttribute("href", EDITED.instagram);

    await gotoAndWait(page, "/shipping.html");
    await expect(page.locator('.section-shipping [data-link="instagram"]')).toHaveAttribute("href", EDITED.instagram);

    await gotoAndWait(page, "/");
    await page.locator(".product-card").first().click();
    await expect(page.locator(".product-modal-order")).toHaveAttribute("href", EDITED.instagram);
  });

  test("an email address is shown in the footer and on the Contact page once set", async ({ page }) => {
    await serveLinks(page, EDITED);
    await gotoAndWait(page, "/contact.html");

    const emailLinks = page.locator('[data-link="email"]');
    await expect(emailLinks).toHaveCount(2);
    for (const el of await emailLinks.all()) {
      await expect(el).toBeVisible();
      await expect(el).toHaveAttribute("href", "mailto:hello@example.com");
    }
    await expect(page.locator('[data-link-handle="email"]')).toHaveText("hello@example.com");
  });

  test("with no email address, the email items stay hidden", async ({ page }) => {
    await serveLinks(page, { ...EDITED, email: "" });
    await gotoAndWait(page, "/contact.html");
    await expect(page.locator('[data-link-optional="email"]')).toHaveCount(2);
    for (const el of await page.locator('[data-link-optional="email"]').all()) await expect(el).toBeHidden();
  });

  test("the email item gets the same icon style as the other links", async ({ page }) => {
    await serveLinks(page, EDITED);
    await gotoAndWait(page, "/");
    const mask = await page
      .locator('.site-footer [data-link="email"] .icon-mail')
      .evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage);
    expect(mask).toContain("media/icons/mail.svg");
  });
});

test.describe("unsafe or malformed links are refused", () => {
  // The values go into href attributes; a `javascript:` URL there would run code when
  // clicked. Invalid values must be ignored and the built-in default kept.
  const BAD = {
    instagram: "javascript:alert(document.cookie)",
    telegram: "https://evil.example/t.me/x",
    vinted: "data:text/html,<script>alert(1)</script>",
    email: 'a@b.co?subject=x"><img src=x onerror=alert(1)>',
  };

  test("invalid links keep the defaults and invalid email stays hidden", async ({ page }) => {
    const warnings = [];
    page.on("console", (m) => m.type() === "warning" && warnings.push(m.text()));
    await serveLinks(page, BAD);
    await gotoAndWait(page, "/contact.html");

    for (const kind of ["instagram", "telegram", "vinted"]) {
      for (const el of await page.locator(`[data-link="${kind}"]`).all()) {
        const href = await el.getAttribute("href");
        expect(href, `${kind} must not take the bad value`).not.toBe(BAD[kind]);
        expect(href).toMatch(/^https:\/\//);
      }
    }
    for (const el of await page.locator('[data-link-optional="email"]').all()) await expect(el).toBeHidden();
    expect(warnings.filter((w) => w.includes("Ignoring invalid")).length).toBe(4);
  });

  test("the product Order button refuses an unsafe Instagram link", async ({ page }) => {
    await serveLinks(page, BAD);
    await gotoAndWait(page, "/");
    await page.locator(".product-card").first().click();
    await expect(page.locator(".product-modal-order")).toHaveAttribute("href", /^https:\/\/www\.instagram\.com\//);
  });

  test("if links.json can't be loaded, the default links still work", async ({ page }) => {
    await page.route("**/content/links.json", (route) => route.fulfill({ status: 404, body: "" }));
    await gotoAndWait(page, "/contact.html");
    await expect(page.locator('.contact-link[data-link="instagram"]')).toHaveAttribute("href", /^https:\/\/www\.instagram\.com\//);
    for (const el of await page.locator('[data-link-optional="email"]').all()) await expect(el).toBeHidden();
  });
});

test("the real content/links.json is applied as-is", async ({ page }) => {
  await gotoAndWait(page, "/contact.html");
  for (const kind of ["instagram", "telegram", "vinted"]) {
    await expect(page.locator(`.contact-link[data-link="${kind}"]`)).toHaveAttribute("href", links[kind]);
  }
});
