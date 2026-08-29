import { PRODUCTS } from "../data/products.js";
import { ProductCard } from "../components/ProductCard.js";

export async function HomePage() {
  const featured = PRODUCTS.filter((p) => p.tags.includes("featured"));

  return `
    <section class="container hero">
      <div>
        <p class="eyebrow rise-in">Slow coffee, made deliberately</p>
        <h1 class="rise-in rise-in--d1">Brew gear for<br/>people who don't rush<br/>the pour.</h1>
      </div>
      <div class="rise-in rise-in--d2">
        <p style="max-width:32ch; opacity:0.8;">
          Eleven pieces, tested against a hundred bad mornings. Brewers, grinders,
          single-origin beans, and the small tools that make the ritual work.
        </p>
        <div style="margin-top:var(--space-4); display:flex; gap:var(--space-3);">
          <a class="btn btn-primary" href="#/catalog">Shop all goods</a>
          <a class="btn btn-ghost" href="#/catalog/brewers">Browse brewers</a>
        </div>
      </div>
    </section>

    <section class="container page-section" data-reveal>
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:var(--space-5);">
        <h2>Featured</h2>
        <a href="#/catalog" class="eyebrow">View all →</a>
      </div>
      <div class="product-grid">
        ${featured.map((p, i) => ProductCard(p, i)).join("")}
      </div>
    </section>

    <section class="container page-section" data-reveal>
      <div class="catalog-layout" style="grid-template-columns: 1fr 1fr;">
        <div>
          <p class="eyebrow">01 — The pour</p>
          <h3>Water is the ingredient nobody buys.</h3>
          <p style="opacity:0.75; margin-top:var(--space-3);">
            Every brewer in the shop is chosen for how it moves water, not how
            it looks on a shelf. Fluted channels, fixed-rate spouts, vapor
            pressure — different mechanics, same goal: even extraction.
          </p>
        </div>
        <div>
          <p class="eyebrow">02 — The grind</p>
          <h3>Consistency beats intensity.</h3>
          <p style="opacity:0.75; margin-top:var(--space-3);">
            A burr grinder set once and used daily will outperform an
            expensive bag of beans ground unevenly. Start there.
          </p>
        </div>
      </div>
    </section>
  `;
}
