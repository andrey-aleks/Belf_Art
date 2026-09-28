const INSTAGRAM_URL = "https://www.instagram.com/be1fegor_jewelry/";

function renderProducts(items) {
  const grid = document.getElementById("product-grid");

  if (items.length === 0) {
    grid.innerHTML = `<p class="filter-empty">${t("shop.empty")}</p>`;
    return;
  }

  grid.innerHTML = items
    .map((item) => {
      const product = localizedProduct(item);
      const badge = product.soldOut ? `<span class="sold-out-badge">${t("product.soldOut")}</span>` : "";

      return `
    <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-haspopup="dialog" aria-label="${t("product.viewDetails", { name: product.name })}">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
        ${badge}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${product.price}</p>
        <span class="icon icon-star product-star" aria-hidden="true"></span>
      </div>
    </article>
  `;
    })
    .join("");
}

function sortProducts(items, sortValue) {
  const sorted = [...items];
  const priceOf = (p) => parseFloat(p.price);
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

// The category strip is built from whatever distinct `category` values exist in the
// data, using the first product of each category as the tile's picture — so it can't
// drift out of sync with data.js. Clicking a tile shows only that category; clicking the
// active tile again shows everything.
let activeCategory = null;

function renderCategoryFilters(items) {
  const container = document.getElementById("category-filters");
  if (!container) return;

  const categories = [...new Set(items.map((p) => p.category))];
  container.innerHTML = categories
    .map((category) => {
      const cover = items.find((p) => p.category === category);
      return `
    <button type="button" class="category-tile" data-category="${category}" aria-pressed="${category === activeCategory}">
      <img class="category-image" src="${cover.image}" alt="" loading="lazy" />
      <span class="category-label">${categoryLabel(category)}</span>
    </button>
  `;
    })
    .join("");
}

function setActiveCategory(category) {
  activeCategory = activeCategory === category ? null : category;
  document.querySelectorAll(".category-tile").forEach((tile) => {
    tile.setAttribute("aria-pressed", String(tile.dataset.category === activeCategory));
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

renderCategoryFilters(products);
applyFiltersAndSort();

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
  const images = product.images && product.images.length ? product.images : [product.image];

  modalTitle.textContent = product.name;
  modalDescription.textContent = product.description || "";
  modalPrice.textContent = product.price;
  setModalImage(images[0]);

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
        <button type="button" class="product-modal-thumb" data-src="${src}" aria-label="${t("modal.photo", { n: i + 1 })}">
          <img src="${src}" alt="" />
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

function findProductById(id) {
  return products.find((p) => p.id === id);
}

const grid = document.getElementById("product-grid");

grid.addEventListener("click", (event) => {
  const card = event.target.closest(".product-card");
  if (!card) return;
  const product = findProductById(Number(card.dataset.productId));
  if (product) openModal(product);
});

grid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".product-card");
  if (!card) return;
  event.preventDefault();
  const product = findProductById(Number(card.dataset.productId));
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
