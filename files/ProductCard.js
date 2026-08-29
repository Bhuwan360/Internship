import { formatCurrency, productArtSVG, escapeHtml } from "../utils.js";

const ROAST_LABELS = ["", "Light", "Light-Med", "Medium", "Med-Dark", "Dark"];

export function ProductCard(product, index = 0) {
  const badge = product.tags.includes("new")
    ? "New"
    : product.tags.includes("featured")
    ? "Featured"
    : "";

  const roast = product.roast
    ? `<div class="roast-dial" title="Roast: ${ROAST_LABELS[product.roast]}">
        <span>${ROAST_LABELS[product.roast]}</span>
        <span class="roast-dial__track">
          <span class="roast-dial__fill" style="width:${(product.roast / 5) * 100}%"></span>
        </span>
      </div>`
    : "";

  return `
    <article class="product-card" style="animation-delay:${Math.min(index, 8) * 45}ms">
      <a href="#/product/${product.id}" aria-label="View ${escapeHtml(product.name)}">
        <div class="product-card__art">
          ${badge ? `<span class="product-card__badge">${badge}</span>` : ""}
          ${productArtSVG(product)}
        </div>
      </a>
      <div class="product-card__body">
        <div>
          <a href="#/product/${product.id}"><p class="product-card__name">${escapeHtml(product.name)}</p></a>
          <p class="product-card__cat">${product.category}</p>
        </div>
        <p class="product-card__price">${formatCurrency(product.price)}</p>
      </div>
      ${roast}
    </article>
  `;
}
