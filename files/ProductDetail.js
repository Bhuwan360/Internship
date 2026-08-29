import { getProduct, getRelated } from "../data/products.js";
import { formatCurrency, productArtSVG, toast, escapeHtml } from "../utils.js";
import { store } from "../store.js";
import { ProductCard } from "../components/ProductCard.js";
import { NotFoundPage } from "./NotFound.js";

let currentProduct = null;

export async function ProductDetailPage(params) {
  const product = getProduct(params.id);
  if (!product) return NotFoundPage();
  currentProduct = product;
  const related = getRelated(product);

  return `
    <section class="container page-section">
      <a href="#/catalog/${product.category}" class="eyebrow">← Back to ${product.category}</a>
      <div class="product-detail-layout" style="margin-top:var(--space-4);">
        <div class="product-card__art" style="aspect-ratio:1;">
          ${productArtSVG(product)}
        </div>
        <div>
          <p class="eyebrow">${product.category}</p>
          <h1 style="font-size:var(--step-3); margin-top:var(--space-2);">${escapeHtml(product.name)}</h1>
          <p class="mono" style="font-size:var(--step-1); margin-top:var(--space-3);">${formatCurrency(product.price)}</p>
          <p style="margin-top:var(--space-4); max-width:38ch; opacity:0.85;">${escapeHtml(product.blurb)}</p>

          <dl style="margin-top:var(--space-5);">
            ${Object.entries(product.specs)
              .map(([k, v]) => `<div class="spec-row"><dt>${k}</dt><dd>${escapeHtml(String(v))}</dd></div>`)
              .join("")}
          </dl>

          <div style="display:flex; align-items:center; gap:var(--space-4); margin-top:var(--space-5);">
            <div class="qty-stepper" id="detail-qty">
              <button type="button" data-action="dec" aria-label="Decrease quantity">−</button>
              <span id="detail-qty-val">1</span>
              <button type="button" data-action="inc" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn-primary" id="add-to-cart">Add to cart</button>
          </div>
        </div>
      </div>

      ${
        related.length
          ? `<div style="margin-top:var(--space-7);">
              <h3 style="margin-bottom:var(--space-4);">You might also like</h3>
              <div class="product-grid">${related.map((p, i) => ProductCard(p, i)).join("")}</div>
            </div>`
          : ""
      }
    </section>
  `;
}

function wire() {
  const main = document.getElementById("app-main");
  if (!main || !currentProduct || !location.hash.startsWith("#/product/")) return;

  let qty = 1;
  const qtyVal = main.querySelector("#detail-qty-val");
  main.querySelector('#detail-qty [data-action="inc"]')?.addEventListener("click", () => {
    qty += 1;
    qtyVal.textContent = qty;
  });
  main.querySelector('#detail-qty [data-action="dec"]')?.addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    qtyVal.textContent = qty;
  });

  main.querySelector("#add-to-cart")?.addEventListener("click", () => {
    store.addItem(currentProduct.id, qty);
    toast(`Added ${qty} × ${currentProduct.name} to cart`);
  });
}

document.addEventListener("route:rendered", wire);
