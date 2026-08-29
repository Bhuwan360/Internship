import { store } from "../store.js";
import { debounce } from "../utils.js";

export function renderHeader(container, router) {
  container.innerHTML = `
    <div class="container header-row">
      <a href="#/" class="logo">DRIFT</a>
      <nav class="header-nav">
        <ul class="header-nav__links">
          <li><a href="#/catalog">All Goods</a></li>
          <li><a href="#/catalog/brewers">Brewers</a></li>
          <li><a href="#/catalog/grinders">Grinders</a></li>
          <li><a href="#/catalog/beans">Beans</a></li>
        </ul>
        <label class="search-field">
          <span class="visually-hidden">Search products</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input id="global-search" type="search" placeholder="Search coffee gear…" />
        </label>
      </nav>
      <div class="header-actions">
        <button class="icon-btn" id="cart-trigger" aria-label="Open cart">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-13z"/><path d="M6 6 4.5 2H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>
          <span class="cart-count" id="cart-count" hidden>0</span>
        </button>
      </div>
    </div>
  `;

  const countEl = container.querySelector("#cart-count");
  const syncCount = () => {
    const n = store.count;
    countEl.textContent = n;
    countEl.hidden = n === 0;
  };
  syncCount();
  store.subscribe(syncCount);

  container.querySelector("#cart-trigger").addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("cart:toggle"));
  });

  const search = container.querySelector("#global-search");
  search.addEventListener(
    "input",
    debounce((e) => {
      const q = e.target.value.trim();
      router.navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
    }, 320)
  );
}
