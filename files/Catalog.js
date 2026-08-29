import { PRODUCTS, CATEGORIES } from "../data/products.js";
import { ProductCard } from "../components/ProductCard.js";
import { FiltersSidebar } from "../components/Filters.js";

const state = {
  categories: [],
  sort: "featured",
  q: "",
};

function applyFilters() {
  let list = [...PRODUCTS];

  if (state.q) {
    const q = state.q.toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.blurb.toLowerCase().includes(q) || p.category.includes(q)
    );
  }

  if (state.categories.length) {
    list = list.filter((p) => state.categories.includes(p.category));
  }

  switch (state.sort) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      list.sort((a, b) => (b.tags.includes("featured") ? 1 : 0) - (a.tags.includes("featured") ? 1 : 0));
  }

  return list;
}

function renderGrid() {
  const grid = document.getElementById("catalog-grid");
  const count = document.getElementById("catalog-count");
  if (!grid) return;
  const results = applyFilters();
  count.textContent = `${results.length} item${results.length === 1 ? "" : "s"}`;
  grid.innerHTML = results.length
    ? results.map((p, i) => ProductCard(p, i)).join("")
    : `<p class="empty-state">Nothing matches those filters yet. Try clearing a few.</p>`;
}

export async function CatalogPage(params, query) {
  state.categories = params.category ? [params.category] : [];
  state.q = query.get("q") || "";
  state.sort = "featured";

  const label = params.category
    ? CATEGORIES.find((c) => c.id === params.category)?.label
    : "All goods";

  return `
    <section class="container page-section">
      <p class="eyebrow">Catalog</p>
      <h2 style="margin-bottom:var(--space-5);">${label}</h2>
      <div class="catalog-layout">
        ${FiltersSidebar(state)}
        <div>
          <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-4);">
            <span id="catalog-count" class="eyebrow"></span>
            ${state.q ? `<span class="eyebrow">Search: "${state.q}"</span>` : ""}
          </div>
          <div class="product-grid" id="catalog-grid"></div>
        </div>
      </div>
    </section>
  `;
}

function wire() {
  const main = document.getElementById("app-main");
  if (!main || !location.hash.startsWith("#/catalog")) return;

  renderGrid();

  main.querySelectorAll('input[name="category"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.categories = Array.from(main.querySelectorAll('input[name="category"]:checked')).map((i) => i.value);
      renderGrid();
    });
  });

  main.querySelector("#sort-select")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  main.querySelector("#filters-reset")?.addEventListener("click", () => {
    state.categories = [];
    state.sort = "featured";
    state.q = "";
    main.querySelectorAll('input[name="category"]').forEach((i) => (i.checked = false));
    main.querySelector("#sort-select").value = "featured";
    renderGrid();
  });
}

document.addEventListener("route:rendered", wire);
