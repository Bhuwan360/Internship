/**
 * Minimal client-side router.
 *
 * Uses hash routing (#/catalog/beans) instead of the History API on
 * purpose: it means DRIFT works as a plain static bundle on any host —
 * Vercel, Netlify, Render, GitHub Pages, a local file server — with no
 * rewrite rules required so a hard refresh on a deep link never 404s.
 */
export class Router {
  constructor(outlet) {
    this.outlet = outlet;
    this.routes = [];
    this.notFound = null;
    window.addEventListener("hashchange", () => this._resolve());
  }

  add(pattern, handler) {
    const paramNames = [];
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/:[^/]+/g, (match) => {
            paramNames.push(match.slice(1));
            return "([^/]+)";
          })
          .replace(/\//g, "\\/") +
        "$"
    );
    this.routes.push({ regex, paramNames, handler });
    return this;
  }

  fallback(handler) {
    this.notFound = handler;
    return this;
  }

  start() {
    if (!location.hash) location.hash = "#/";
    this._resolve();
  }

  navigate(path) {
    location.hash = path.startsWith("#") ? path : `#${path}`;
  }

  async _resolve() {
    const path = location.hash.slice(1) || "/";
    const [rawPath] = path.split("?");
    const query = new URLSearchParams(path.split("?")[1] || "");

    for (const route of this.routes) {
      const match = rawPath.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
        await this._render(route.handler, params, query);
        return;
      }
    }
    if (this.notFound) await this._render(this.notFound, {}, query);
  }

  async _render(handler, params, query) {
    this.outlet.classList.add("is-loading");
    const html = await handler(params, query);
    this.outlet.innerHTML = html;
    this.outlet.classList.remove("is-loading");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    this._observeReveals();
    document.dispatchEvent(new CustomEvent("route:rendered", { detail: { params, query } }));
  }

  _observeReveals() {
    const targets = this.outlet.querySelectorAll("[data-reveal]");
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => io.observe(t));
  }
}
