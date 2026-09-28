const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { text, site, gotoAndWait } = require("./helpers");

// Nav labels come from content/texts.json (editable in the CMS).
const PAGES = [
  { path: "/index.html", href: "index.html", label: text("nav.shop") },
  { path: "/about.html", href: "about.html", label: text("nav.about") },
  { path: "/custom-orders.html", href: "custom-orders.html", label: text("nav.custom") },
  { path: "/shipping.html", href: "shipping.html", label: text("nav.shipping") },
  { path: "/contact.html", href: "contact.html", label: text("nav.contact") },
];

const INSTAGRAM_PATTERN = /instagram\.com\/be1fegor_jewelry/;
const TELEGRAM_URL = "https://t.me/be11fegor";
const VINTED_URL = "https://www.vinted.pl/member/306870155-be1fegor";

for (const { path: pagePath, href: pageHref, label } of PAGES) {
  test.describe(`${label} page`, () => {
    test.beforeEach(async ({ page }) => {
      await gotoAndWait(page, pagePath);
    });

    test("has a nav with all five pages in order", async ({ page }) => {
      const links = page.locator(".site-nav a");
      await expect(links).toHaveCount(PAGES.length);

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

    test("header shows the Belfegor logo linking home", async ({ page }) => {
      const logo = page.locator(".site-header .site-logo");
      await expect(logo).toHaveAttribute("href", "index.html");
      await expect(logo).toHaveAccessibleName(/Belfegor/);
      const img = logo.locator(".site-logo-image");
      await expect(img).toHaveAttribute("src", "media/brand/logo.webp");
      expect(await img.evaluate((el) => el.decode().then(() => el.naturalWidth > 0)), "logo image loads").toBe(true);
      const height = await img.evaluate((el) => el.getBoundingClientRect().height);
      expect(height, "logo should be clearly visible").toBeGreaterThanOrEqual(80);
    });

    test("footer has working Instagram, Telegram and Vinted links", async ({ page }) => {
      const links = page.locator(".site-footer .footer-link");
      await expect(links).toHaveCount(3);
      await expect(links.nth(0)).toHaveAttribute("href", INSTAGRAM_PATTERN);
      await expect(links.nth(1)).toHaveAttribute("href", TELEGRAM_URL);
      await expect(links.nth(2)).toHaveAttribute("href", VINTED_URL);
      await expect(page.locator(".footer-questions")).toHaveAttribute("href", "contact.html");
    });

    test("shows the features strip", async ({ page }) => {
      await expect(page.locator(".features .feature")).toHaveCount(3);
      await expect(page.locator(".feature-script")).toBeVisible();
    });

    test("never scrolls horizontally", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });

    test("footer sticks to the bottom of the viewport even when content is short", async ({ page }) => {
      // Regression guard: on short pages the footer used to sit right after the content,
      // leaving a large empty band below it on tall screens.
      const width = page.viewportSize().width;
      await page.setViewportSize({ width, height: 2400 });

      const { footerBottom, viewportHeight, scrollHeight } = await page.evaluate(() => ({
        footerBottom: document.querySelector(".site-footer").getBoundingClientRect().bottom,
        viewportHeight: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
      }));

      if (scrollHeight <= viewportHeight) {
        expect(Math.abs(footerBottom - viewportHeight), "footer should end at the viewport bottom").toBeLessThanOrEqual(1);
      } else {
        expect(Math.abs(footerBottom - scrollHeight), "footer should end at the page bottom").toBeLessThanOrEqual(1);
      }
    });

    for (const target of PAGES) {
      if (target.href === pageHref) continue;

      test(`nav link navigates to the ${target.label} page`, async ({ page }) => {
        await page.click(`.site-nav a[href="${target.href}"]`);
        await expect(page).toHaveURL(new RegExp(`${target.href.replace(".", "\\.")}$`));
        await expect(page.locator('.site-nav a[aria-current="page"]')).toHaveText(target.label);
      });
    }
  });
}

test("header and footer markup is identical on every page (apart from the current nav item)", () => {
  // Shared chrome is hand-duplicated across the static pages; this catches one copy
  // drifting out of sync with the others.
  const root = path.join(__dirname, "..");
  const extract = (html, tag) => {
    const match = html.match(new RegExp(`<${tag} class="site-${tag}"[\\s\\S]*?</${tag}>`));
    return match ? match[0].replace(/ aria-current="page"/g, "") : null;
  };

  const chromes = PAGES.map((p) => {
    const html = fs.readFileSync(path.join(root, p.href), "utf8");
    const features = html.match(/<section class="features"[\s\S]*?<\/section>/);
    return {
      page: p.href,
      header: extract(html, "header"),
      footer: extract(html, "footer"),
      features: features && features[0],
    };
  });

  for (const chrome of chromes) {
    expect(chrome.header, `${chrome.page} header`).toBe(chromes[0].header);
    expect(chrome.footer, `${chrome.page} footer`).toBe(chromes[0].footer);
    expect(chrome.features, `${chrome.page} features strip`).toBe(chromes[0].features);
  }
});

test("About page has a heading, photo placeholder, and non-empty bio", async ({ page }) => {
  await gotoAndWait(page, "/about.html");
  await expect(page.locator(".section-title")).toHaveText(text("about.title"));
  await expect(page.locator(".about-photo")).toBeVisible();
  if (!site.aboutPhoto) await expect(page.locator(".about-photo")).toHaveText(text("about.photo"));
  await expect(page.locator(".about-bio")).not.toBeEmpty();
});

test("Shipping page has a heading, mentions Poland, and links to Instagram", async ({ page }) => {
  await gotoAndWait(page, "/shipping.html");
  await expect(page.locator(".section-title")).toHaveText(text("shipping.title"));
  await expect(page.locator(".shipping-content")).toContainText(/poland/i);
  await expect(page.locator(".shipping-content a")).toHaveAttribute("href", INSTAGRAM_PATTERN);
});

test("Custom Orders page lists the steps and links to Instagram", async ({ page }) => {
  await gotoAndWait(page, "/custom-orders.html");
  await expect(page.locator(".section-title")).toHaveText(text("custom.title"));
  await expect(page.locator(".custom-step")).toHaveCount(4);
  await expect(page.locator(".custom-cta-wrap a")).toHaveAttribute("href", INSTAGRAM_PATTERN);
});

test("Contact page links to Instagram, Telegram and Vinted", async ({ page }) => {
  await gotoAndWait(page, "/contact.html");
  await expect(page.locator(".section-title")).toHaveText(text("contact.title"));
  const links = page.locator(".contact-link");
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute("href", INSTAGRAM_PATTERN);
  await expect(links.nth(1)).toHaveAttribute("href", TELEGRAM_URL);
  await expect(links.nth(2)).toHaveAttribute("href", VINTED_URL);
});

test("every page declares the favicon, and it is served as a 32x32 image", async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p.path);
    await expect(page.locator('link[rel="icon"][href="favicon.png"]')).toHaveAttribute("sizes", "32x32");
    await expect(page.locator('link[rel="icon"][href="favicon.ico"]')).toHaveCount(1);
  }

  const size = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
        img.onerror = reject;
        img.src = "favicon.png";
      })
  );
  expect(size).toEqual([32, 32]);

  for (const file of ["favicon.png", "favicon.ico"]) {
    const res = await page.request.get(`/${file}`);
    expect(res.status(), file).toBe(200);
  }
});

test("About page shows the photo from content/site.json when one is set", async ({ page }) => {
  // Also covers the leading slash the CMS writes into image paths ("/media/web/x.webp"),
  // which would point outside the site on a GitHub Pages sub-path if used as-is.
  await page.route("**/content/site.json", (route) =>
    route.fulfill({ json: { heroImage: site.heroImage, aboutPhoto: "/media/web/1000030969-01.jpg" } })
  );
  await gotoAndWait(page, "/about.html");

  const img = page.locator(".about-photo .about-photo-image");
  await expect(img).toHaveAttribute("src", "media/web/1000030969-01.jpg");
  expect(await img.evaluate((el) => el.decode().then(() => el.naturalWidth > 0))).toBe(true);
});

test("About page keeps the placeholder when no photo is set", async ({ page }) => {
  await page.route("**/content/site.json", (route) =>
    route.fulfill({ json: { heroImage: site.heroImage, aboutPhoto: "" } })
  );
  await gotoAndWait(page, "/about.html");
  await expect(page.locator(".about-photo .about-photo-image")).toHaveCount(0);
});

test("the header logo has a transparent background (no black box on the textured page)", async ({ page }) => {
  await gotoAndWait(page, "/index.html");
  const alphas = await page.locator(".site-logo-image").evaluate(async (img) => {
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const w = canvas.width - 1;
    const h = canvas.height - 1;
    return [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3]);
  });
  expect(alphas).toEqual([0, 0, 0, 0]);
});

test("every icon file referenced by the stylesheet exists", () => {
  const root = path.join(__dirname, "..");
  const css = fs.readFileSync(path.join(root, "css", "style.css"), "utf8");
  const refs = [...css.matchAll(/url\("\.\.\/(media\/icons\/[^"]+)"\)/g)].map((m) => m[1]);
  expect(refs.length).toBeGreaterThan(0);
  for (const ref of refs) {
    expect(fs.existsSync(path.join(root, ref)), `missing ${ref}`).toBe(true);
  }
});
