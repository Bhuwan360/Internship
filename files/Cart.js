import { store } from "../store.js";
import { formatCurrency, productArtSVG, toast } from "../utils.js";

export async function CartPage() {
  const lines = store.lines;

  if (!lines.length) {
    return `
      <section class="container page-section" style="text-align:center;">
        <p class="eyebrow">Cart</p>
        <h2 style="margin-top:var(--space-2);">Empty, for now.</h2>
        <p style="opacity:0.7; margin-top:var(--space-3);">Nothing in here yet — go find something worth a slow Sunday.</p>
        <a class="btn btn-primary" style="margin-top:var(--space-5); display:inline-flex;" href="#/catalog">Browse the catalog</a>
      </section>
    `;
  }

  return `
    <section class="container page-section">
      <p class="eyebrow">Cart</p>
      <h2 style="margin-bottom:var(--space-5);">Your order</h2>
      <div class="product-detail-layout">
        <div id="cart-page-lines" style="display:flex; flex-direction:column; gap:var(--space-4);">
          ${lines
            .map(
              (l) => `
            <div class="cart-line" data-id="${l.id}" style="align-items:center; border-bottom:1px solid var(--color-line); padding-bottom:var(--space-4);">
              <div class="cart-line__art" style="width:4.5rem; height:4.5rem;">${productArtSVG(l.product)}</div>
              <div>
                <p style="font-weight:500;">${l.product.name}</p>
                <p class="mono eyebrow" style="margin-top:2px;">${formatCurrency(l.product.price)} each</p>
                <div class="qty-stepper" style="margin-top:var(--space-2);">
                  <button data-action="dec" aria-label="Decrease quantity">−</button>
                  <span>${l.qty}</span>
                  <button data-action="inc" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div style="text-align:right;">
                <p class="mono">${formatCurrency(l.product.price * l.qty)}</p>
                <button class="eyebrow" data-action="remove" style="margin-top:var(--space-2); text-decoration:underline;">Remove</button>
              </div>
            </div>`
            )
            .join("")}
        </div>

        <aside>
          <div class="spec-row"><dt>Subtotal</dt><dd class="mono">${formatCurrency(store.subtotal)}</dd></div>
          <div class="spec-row"><dt>Shipping</dt><dd class="mono">Calculated at checkout</dd></div>
          <div class="spec-row" style="font-weight:600;"><dt>Estimated total</dt><dd class="mono">${formatCurrency(store.subtotal)}</dd></div>
          <button class="btn btn-primary btn-block" id="checkout-submit" style="margin-top:var(--space-4);">
            Complete order
          </button>
          <p class="eyebrow" style="margin-top:var(--space-3); opacity:0.6;">Demo checkout — no payment is processed.</p>
        </aside>
      </div>
    </section>
  `;
}

function wire() {
  const main = document.getElementById("app-main");
  if (!main || location.hash !== "#/cart") return;

  main.querySelectorAll(".cart-line").forEach((line) => {
    const id = line.dataset.id;
    const item = store.state.items.find((i) => i.id === id);
    if (!item) return;
    line.querySelector('[data-action="inc"]')?.addEventListener("click", () => store.setQty(id, item.qty + 1));
    line.querySelector('[data-action="dec"]')?.addEventListener("click", () => store.setQty(id, item.qty - 1));
    line.querySelector('[data-action="remove"]')?.addEventListener("click", () => store.removeItem(id));
  });

  main.querySelector("#checkout-submit")?.addEventListener("click", () => {
    toast("Order placed — thanks for slowing down with us.");
    store.clear();
    location.hash = "#/";
  });
}

document.addEventListener("route:rendered", wire);
