import { store } from "../store.js";
import { formatCurrency, productArtSVG } from "../utils.js";

export function mountCartDrawer(root, router) {
  const scrim = document.createElement("div");
  scrim.className = "cart-drawer__scrim";
  const drawer = document.createElement("aside");
  drawer.className = "cart-drawer";
  drawer.setAttribute("aria-label", "Shopping cart");
  root.append(scrim, drawer);

  let open = false;

  function setOpen(next) {
    open = next;
    scrim.classList.toggle("is-open", open);
    drawer.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  function render() {
    const lines = store.lines;
    drawer.innerHTML = `
      <div class="cart-drawer__head">
        <h3 style="font-size:var(--step-1)">Your cart</h3>
        <button class="icon-btn" id="cart-close" aria-label="Close cart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="cart-drawer__items">
        ${
          lines.length
            ? lines
                .map(
                  (l) => `
              <div class="cart-line" data-id="${l.id}">
                <div class="cart-line__art">${productArtSVG(l.product)}</div>
                <div>
                  <p style="font-size:var(--step--1); font-weight:500;">${l.product.name}</p>
                  <div class="cart-line__qty">
                    <button class="qty-btn" data-action="dec" aria-label="Decrease quantity">−</button>
                    <span>${l.qty}</span>
                    <button class="qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
                    <button class="qty-btn" data-action="remove" aria-label="Remove item" style="margin-left:6px">×</button>
                  </div>
                </div>
                <p class="mono" style="font-size:var(--step--1)">${formatCurrency(l.product.price * l.qty)}</p>
              </div>`
                )
                .join("")
            : `<p class="empty-state">Your cart is empty. Go pour something over it.</p>`
        }
      </div>
      <div class="cart-drawer__foot">
        <div class="spec-row" style="border:none;">
          <dt>Subtotal</dt>
          <dd class="mono">${formatCurrency(store.subtotal)}</dd>
        </div>
        <button class="btn btn-primary btn-block" id="cart-checkout" ${lines.length ? "" : "disabled"}>
          Go to checkout
        </button>
      </div>
    `;

    drawer.querySelector("#cart-close").addEventListener("click", () => setOpen(false));
    drawer.querySelector("#cart-checkout")?.addEventListener("click", () => {
      setOpen(false);
      router.navigate("/cart");
    });
    drawer.querySelectorAll(".cart-line").forEach((line) => {
      const id = line.dataset.id;
      const item = store.state.items.find((i) => i.id === id);
      line.querySelector('[data-action="inc"]').addEventListener("click", () => store.setQty(id, item.qty + 1));
      line.querySelector('[data-action="dec"]').addEventListener("click", () => store.setQty(id, item.qty - 1));
      line.querySelector('[data-action="remove"]').addEventListener("click", () => store.removeItem(id));
    });
  }

  render();
  store.subscribe(render);
  scrim.addEventListener("click", () => setOpen(false));
  document.addEventListener("cart:toggle", () => setOpen(!open));
  document.addEventListener("cart:open", () => setOpen(true));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false);
  });
}
