const INSTAGRAM_URL = "https://www.instagram.com/be1fegor_jewelry/";

function renderProducts(items) {
  const grid = document.getElementById("product-grid");
  grid.innerHTML = items
    .map(
      (product) => `
    <article class="product-card">
      <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
      <h2 class="product-name">${product.name}</h2>
      <p class="product-price">${product.price}</p>
      <a class="order-button" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">
        Order via Instagram
      </a>
    </article>
  `
    )
    .join("");
}

renderProducts(products);
