const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { products } = require("../js/data.js");

const ROOT = path.join(__dirname, "..");

test.describe("product data integrity", () => {
  test("has at least one product", () => {
    expect(products.length).toBeGreaterThan(0);
  });

  test("product ids are unique", () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("each product has required, well-formed fields", () => {
    for (const p of products) {
      expect(typeof p.id, `id of ${JSON.stringify(p)}`).toBe("number");
      expect(p.name && p.name.trim().length > 0, `name of ${JSON.stringify(p)}`).toBe(true);
      expect(p.price, `price of "${p.name}"`).toMatch(/^\d+(\.\d+)?\s?(EUR|USD)$/);
      expect(p.image && p.image.trim().length > 0, `image of "${p.name}"`).toBe(true);
    }
  });

  test("every referenced product image exists on disk", () => {
    for (const p of products) {
      const imgPath = path.join(ROOT, p.image);
      expect(fs.existsSync(imgPath), `Missing image file for "${p.name}": ${p.image}`).toBe(true);
    }
  });
});

test.describe("no leftover placeholders", () => {
  const files = ["index.html", "js/main.js", "js/data.js"];

  for (const file of files) {
    test(`${file} does not contain a placeholder Instagram handle`, () => {
      const content = fs.readFileSync(path.join(ROOT, file), "utf8");
      expect(content).not.toMatch(/your_instagram/i);
    });
  }
});
