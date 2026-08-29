import { Router } from "./router.js";
import { renderHeader } from "./components/Header.js";
import { mountCartDrawer } from "./components/CartDrawer.js";
import { HomePage } from "./pages/Home.js";
import { CatalogPage } from "./pages/Catalog.js";
import { ProductDetailPage } from "./pages/ProductDetail.js";
import { CartPage } from "./pages/Cart.js";
import { NotFoundPage } from "./pages/NotFound.js";

function mountFooter(container) {
  container.innerHTML = `
    <div class="container footer-row">
      <span>DRIFT — Slow Coffee Co.</span>
      <span>Web Development Capstone · built with a modular vanilla-JS SPA</span>
      <span>© ${new Date().getFullYear()}</span>
    </div>
  `;
}

function bootstrap() {
  const outlet = document.getElementById("app-main");
  const router = new Router(outlet);

  renderHeader(document.getElementById("app-header"), router);
  mountFooter(document.getElementById("app-footer"));
  mountCartDrawer(document.getElementById("cart-root"), router);

  router
    .add("/", HomePage)
    .add("/catalog", CatalogPage)
    .add("/catalog/:category", CatalogPage)
    .add("/product/:id", ProductDetailPage)
    .add("/cart", CartPage)
    .fallback(NotFoundPage)
    .start();
}

document.addEventListener("DOMContentLoaded", bootstrap);
