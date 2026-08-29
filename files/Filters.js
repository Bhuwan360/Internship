import { CATEGORIES } from "../data/products.js";

export function FiltersSidebar(active) {
  return `
    <aside class="filters-sidebar">
      <div class="filter-group">
        <h4>Category</h4>
        ${CATEGORIES.map(
          (c) => `
          <label class="filter-option">
            <input type="checkbox" name="category" value="${c.id}" ${active.categories.includes(c.id) ? "checked" : ""} />
            ${c.label}
          </label>`
        ).join("")}
      </div>

      <div class="filter-group">
        <h4>Sort</h4>
        <select id="sort-select" class="mono" style="padding:0.4em; border:1px solid var(--color-line-strong); border-radius:3px;">
          <option value="featured" ${active.sort === "featured" ? "selected" : ""}>Featured</option>
          <option value="price-asc" ${active.sort === "price-asc" ? "selected" : ""}>Price: Low to High</option>
          <option value="price-desc" ${active.sort === "price-desc" ? "selected" : ""}>Price: High to Low</option>
          <option value="name" ${active.sort === "name" ? "selected" : ""}>Name: A–Z</option>
        </select>
      </div>

      <button class="btn btn-ghost" id="filters-reset">Clear filters</button>
    </aside>
  `;
}
