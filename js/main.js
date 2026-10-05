const INSTAGRAM_URL = "https://www.instagram.com/be1fegor_jewelry/";
const CURRENCY = "EUR";

// Filled from content/products.json and content/categories.json (edited in the CMS).
let products = [];
let categories = [];

// Content comes from an editor through the CMS, so it must never be interpreted as
// HTML: every value interpolated into a template below goes through escapeHtml().
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(price) {
  return `${price} ${CURRENCY}`;
}

function productImages(product) {
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  return images.map(assetUrl);
}

// The items most recently rendered into the grid; a card's data-index points into this,
// so cards work for any list passed to renderProducts (filtered, sorted, or a test's).
let renderedItems = [];

function renderProducts(items) {
  const grid = document.getElementById("product-grid");
  renderedItems = items;

  if (items.length === 0) {
    grid.innerHTML = `<p class="filter-empty">${escapeHtml(t("shop.empty"))}</p>`;
    return;
  }

  grid.innerHTML = items
    .map((item, index) => {
      const product = localizedProduct(item);
      const name = escapeHtml(product.name);
      const badge = product.soldOut
        ? `<span class="sold-out-badge">${escapeHtml(t("product.soldOut"))}</span>`
        : "";

      return `
    <article class="product-card" data-index="${index}" tabindex="0" aria-haspopup="dialog" aria-label="${escapeHtml(t("product.viewDetails", { name: product.name }))}">
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeHtml(productImages(product)[0])}" alt="${name}" loading="lazy" />
        ${badge}
      </div>
      <div class="product-info">
        <h3 class="product-name">${name}</h3>
        <p class="product-price">${escapeHtml(formatPrice(product.price))}</p>
        <span class="icon icon-star product-star" aria-hidden="true"></span>
      </div>
    </article>
  `;
    })
    .join("");
}

function sortProducts(items, sortValue) {
  const sorted = [...items];
  const priceOf = (p) => Number(p.price);
  const nameOf = (p) => localizedProduct(p).name;

  switch (sortValue) {
    case "price-asc":
      sorted.sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "name-asc":
      sorted.sort((a, b) => nameOf(a).localeCompare(nameOf(b), getLanguage()));
      break;
    case "name-desc":
      sorted.sort((a, b) => nameOf(b).localeCompare(nameOf(a), getLanguage()));
      break;
    default:
      break;
  }

  return sorted;
}

function categoryLabel(key) {
  const category = categories.find((c) => c.key === key);
  return category ? localize(category.label) : key;
}

// One tile per category that has at least one product, in the order of
// content/categories.json (categories only referenced by products come last), using the
// category's first product photo as its picture. An "All" tile comes first (pressed when
// no category is selected) so visitors can always get back to the full list; clicking
// the active category tile again also shows everything.
let activeCategory = null;

function renderCategoryFilters(items) {
  const container = document.getElementById("category-filters");
  if (!container) return;

  const used = [...new Set(items.map((p) => p.category))];
  const ordered = [...categories.map((c) => c.key).filter((key) => used.includes(key)), ...used.filter((key) => !categories.some((c) => c.key === key))];

  const allTile = `
    <button type="button" class="category-tile category-tile-all" data-category="" aria-pressed="${activeCategory === null}">
      <span class="category-all-icon" aria-hidden="true"><span class="icon icon-star-long"></span></span>
      <span class="category-label">${escapeHtml(t("categories.all"))}</span>
    </button>
  `;

  container.innerHTML =
    allTile +
    ordered
      .map((key) => {
        const cover = items.find((p) => p.category === key);
        return `
      <button type="button" class="category-tile" data-category="${escapeHtml(key)}" aria-pressed="${key === activeCategory}">
        <img class="category-image" src="${escapeHtml(productImages(cover)[0])}" alt="" loading="lazy" />
        <span class="category-label">${escapeHtml(categoryLabel(key))}</span>
      </button>
    `;
      })
      .join("");
}

function setActiveCategory(category) {
  activeCategory = !category || activeCategory === category ? null : category;
  document.querySelectorAll(".category-tile").forEach((tile) => {
    tile.setAttribute("aria-pressed", String(tile.dataset.category === (activeCategory ?? "")));
  });
  applyFiltersAndSort();
}

function applyFiltersAndSort() {
  const availability = document.getElementById("filter-availability").value;
  const sortValue = document.getElementById("sort-select").value;

  const filtered = products.filter((p) => {
    const availabilityKey = p.soldOut ? "out-of-stock" : "in-stock";
    if (availability !== "all" && availability !== availabilityKey) return false;
    if (activeCategory && p.category !== activeCategory) return false;
    return true;
  });

  renderProducts(sortProducts(filtered, sortValue));
}

document.getElementById("category-filters").addEventListener("click", (event) => {
  const tile = event.target.closest(".category-tile");
  if (tile) setActiveCategory(tile.dataset.category);
});

document.querySelectorAll("#filter-availability, #sort-select").forEach((input) => {
  input.addEventListener("change", applyFiltersAndSort);
});

const modal = document.getElementById("product-modal");
const modalImage = modal.querySelector(".product-modal-image");
const modalThumbs = modal.querySelector(".product-modal-thumbs");
const modalTitle = modal.querySelector(".product-modal-title");
const modalDescription = modal.querySelector(".product-modal-description");
const modalPrice = modal.querySelector(".product-modal-price");
const modalOrder = modal.querySelector(".product-modal-order");
const modalClose = modal.querySelector(".product-modal-close");

let lastFocusedElement = null;
let modalProduct = null;

function setModalImage(src) {
  modalImage.src = src;
  modalImage.alt = modalTitle.textContent;
}

function fillModal(item) {
  const product = localizedProduct(item);
  const images = productImages(product);

  modalTitle.textContent = product.name;
  modalDescription.textContent = product.description || "";
  modalPrice.textContent = formatPrice(product.price);
  setModalImage(images[0] || "");

  if (product.soldOut) {
    modalOrder.textContent = t("product.soldOut");
    modalOrder.removeAttribute("href");
    modalOrder.setAttribute("aria-disabled", "true");
    modalOrder.classList.add("is-disabled");
  } else {
    modalOrder.textContent = t("product.order");
    modalOrder.href = INSTAGRAM_URL;
    modalOrder.removeAttribute("aria-disabled");
    modalOrder.classList.remove("is-disabled");
  }

  modalThumbs.innerHTML =
    images.length > 1
      ? images
          .map(
            (src, i) => `
        <button type="button" class="product-modal-thumb" data-src="${escapeHtml(src)}" aria-label="${escapeHtml(t("modal.photo", { n: i + 1 }))}">
          <img src="${escapeHtml(src)}" alt="" />
        </button>
      `
          )
          .join("")
      : "";
}

function openModal(product) {
  modalProduct = product;
  fillModal(product);

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalClose.focus();
}

function closeModal() {
  modal.hidden = true;
  modalProduct = null;
  document.body.classList.remove("modal-open");
  if (lastFocusedElement) lastFocusedElement.focus();
}

function productForCard(card) {
  return renderedItems[Number(card.dataset.index)];
}

const grid = document.getElementById("product-grid");

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".product-card");
  if (!card) return;
  const product = productForCard(card);
  if (product) openModal(product);
});

grid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".product-card");
  if (!card) return;
  event.preventDefault();
  const product = productForCard(card);
  if (product) openModal(product);
});

modal.addEventListener("click", (event) => {
  if (event.target.closest("[data-close]")) closeModal();
});

modalThumbs.addEventListener("click", (event) => {
  const thumb = event.target.closest(".product-modal-thumb");
  if (thumb) setModalImage(thumb.dataset.src);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

document.addEventListener("languagechange", () => {
  renderCategoryFilters(products);
  applyFiltersAndSort();
  if (modalProduct) fillModal(modalProduct);
});

Promise.all([fetchLocalizedContent("content/products.json"), fetchLocalizedContent("content/categories.json"), textsReady])
  .then(([productData, categoryData]) => {
    products = productData.products || [];
    categories = categoryData.categories || [];
    renderCategoryFilters(products);
    applyFiltersAndSort();
  })
  .catch((error) => {
    console.error("Could not load products:", error);
    document.getElementById("product-grid").innerHTML = `<p class="filter-empty">${escapeHtml(t("product.loadError"))}</p>`;
  })
  .finally(() => {
    document.documentElement.dataset.shopReady = "true";
  });
