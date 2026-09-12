const INSTAGRAM_URL = "https://www.instagram.com/be1fegor_jewelry/";

function renderProducts(items) {
  const grid = document.getElementById("product-grid");

  if (items.length === 0) {
    grid.innerHTML = `<p class="filter-empty">No products match your filters.</p>`;
    return;
  }

  grid.innerHTML = items
    .map((product) => {
      const badge = product.soldOut ? `<span class="sold-out-badge">Sold Out</span>` : "";
      const orderControl = product.soldOut
        ? `<span class="order-button is-disabled" aria-disabled="true">Sold Out</span>`
        : `<a class="order-button" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">Order via Instagram</a>`;

      return `
    <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-haspopup="dialog" aria-label="View details for ${product.name}">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
        ${badge}
      </div>
      <h2 class="product-name">${product.name}</h2>
      <p class="product-price">${product.price}</p>
      ${orderControl}
    </article>
  `;
    })
    .join("");
}

function sortProducts(items, sortValue) {
  const sorted = [...items];
  const priceOf = (p) => parseFloat(p.price);

  switch (sortValue) {
    case "price-asc":
      sorted.sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      break;
  }

  return sorted;
}

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((el) => el.checked)
    .map((el) => el.value);
}

function renderCategoryFilters(items) {
  const container = document.getElementById("category-filters");
  if (!container) return;

  const categories = [...new Set(items.map((p) => p.category))];
  container.innerHTML = categories
    .map(
      (category) => `
    <label>
      <input type="checkbox" class="filter-category" value="${category}" checked />
      ${category}
    </label>
  `
    )
    .join("");
}

function applyFiltersAndSort() {
  const availability = getCheckedValues(".filter-availability");
  const categories = getCheckedValues(".filter-category");
  const sortValue = document.querySelector(".filter-sort:checked")?.value || "relevant";

  const filtered = products.filter((p) => {
    const availabilityKey = p.soldOut ? "out-of-stock" : "in-stock";
    if (!availability.includes(availabilityKey)) return false;
    if (!categories.includes(p.category)) return false;
    return true;
  });

  renderProducts(sortProducts(filtered, sortValue));
}

renderCategoryFilters(products);
applyFiltersAndSort();

document.querySelectorAll(".filter-availability, .filter-category, .filter-sort").forEach((input) => {
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

function setModalImage(src) {
  modalImage.src = src;
  modalImage.alt = modalTitle.textContent;
}

function openModal(product) {
  const images = product.images && product.images.length ? product.images : [product.image];

  modalTitle.textContent = product.name;
  modalDescription.textContent = product.description || "";
  modalPrice.textContent = product.price;
  setModalImage(images[0]);

  if (product.soldOut) {
    modalOrder.textContent = "Sold Out";
    modalOrder.removeAttribute("href");
    modalOrder.setAttribute("aria-disabled", "true");
    modalOrder.classList.add("is-disabled");
  } else {
    modalOrder.textContent = "Order via Instagram";
    modalOrder.href = INSTAGRAM_URL;
    modalOrder.removeAttribute("aria-disabled");
    modalOrder.classList.remove("is-disabled");
  }

  modalThumbs.innerHTML =
    images.length > 1
      ? images
          .map(
            (src, i) => `
        <button type="button" class="product-modal-thumb" data-src="${src}" aria-label="Show photo ${i + 1}">
          <img src="${src}" alt="" />
        </button>
      `
          )
          .join("")
      : "";

  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalClose.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocusedElement) lastFocusedElement.focus();
}

function findProductById(id) {
  return products.find((p) => p.id === id);
}

const grid = document.getElementById("product-grid");

grid.addEventListener("click", (event) => {
  if (event.target.closest(".order-button")) return;
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
