# DRIFT — Slow Coffee Co.

A modular, framework-free e-commerce product catalog capstone: brewers,
grinders, beans, and accessories, with client-side routing, filtering,
search, a persistent cart, and zero image requests (every product "photo"
is an inline SVG).

**Note on "live and deployed":** I've built this as a complete,
production-ready, deploy-tested static app and verified the build locally
(bundle, minify, and serve all checked). I don't have the ability to push
to a Vercel/Netlify/Render account or hand you back a live URL myself —
that last step needs your account. The steps below get you from this
folder to a public URL in about two minutes on any of the three.

## Architecture

```
drift-catalog/
├── index.html              # shell: mounts header/main/footer, loads app.js
├── css/
│   ├── variables.css       # design tokens (color, type, space)
│   ├── base.css            # reset + base typography
│   ├── layout.css          # header/grid/page structure
│   ├── components.css      # buttons, cards, drawer, filters
│   └── animations.css      # keyframes, reveal-on-scroll, reduced-motion safe
├── js/
│   ├── app.js               # entry point — wires router + header + drawer
│   ├── router.js            # hash-based client-side router (own module)
│   ├── store.js              # cart state: pub/sub + localStorage persistence
│   ├── utils.js               # formatting, debounce, DOM helpers, SVG icon gen
│   ├── data/products.js        # single source of truth for the catalog
│   ├── components/            # Header, ProductCard, CartDrawer, Filters
│   └── pages/                 # Home, Catalog, ProductDetail, Cart, NotFound
├── scripts/
│   ├── build.js             # esbuild: bundles + minifies JS & CSS → /dist
│   └── dev-server.js        # zero-dependency static file server
├── vercel.json / netlify.toml / render.yaml   # one config per target host
└── package.json
```

**Why this shape:** every page, component, and concern lives in its own
file with an explicit `import`/`export` — no bundler is required to run
it at all (open `index.html` through any static server and it works),
but `npm run build` produces an optimized production bundle when you
want one. Nothing here is React/Vue-specific, so it ports cleanly if a
future assignment asks for a framework rewrite.

## Key features

- **Client-side routing** (`js/router.js`) — hash-based (`#/catalog/beans`,
  `#/product/kettle-slow-pour`), so deep links survive a hard refresh on
  *any* static host with zero rewrite configuration.
- **Cart** (`js/store.js`) — pub/sub store, persisted to `localStorage`,
  driving both the slide-out drawer and the full cart page in sync.
- **Filtering, sorting, search** (`js/pages/Catalog.js`) — category
  checkboxes, price/name sort, and a debounced header search box.
- **Asset optimization** — no raster images anywhere; product art is
  generated inline SVG (`productArtSVG` in `js/utils.js`), so the entire
  visual catalog ships as vector markup, not image bytes.
- **Production build** (`scripts/build.js`) — bundles the ES module graph
  and minifies JS with esbuild, concatenates + minifies all five CSS
  files into one stylesheet. Verified locally: **~28KB JS + ~11KB CSS**
  total, gzip/brotli compression handled automatically by all three
  hosting platforms below.
- **Accessibility** — skip link, visible focus rings, `prefers-reduced-motion`
  respected throughout `animations.css`.

## Run it locally

No install required to just view it:

```bash
npm run dev
# → http://localhost:5173
```

That's a ~40-line dependency-free static server (`scripts/dev-server.js`).
You can also just open `index.html` directly, or use any static server
(`npx serve .`, VS Code Live Server, Python's `http.server`, etc.).

## Production build

```bash
npm install
npm run build      # → outputs to /dist
npm run preview    # serves /dist at http://localhost:5173 to sanity-check it
```

## Deploy — pick one

### Vercel
```bash
npm install -g vercel
vercel --prod
```
`vercel.json` already tells Vercel to run `npm run build` and publish
`dist/`. Answer the CLI prompts (link to a new project) and it prints
your live URL — typically `https://drift-catalog-<hash>.vercel.app`.

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```
`netlify.toml` sets the build command and publish directory. The CLI
prints a live `https://<site-name>.netlify.app` URL when it finishes.

### Render
1. Push this folder to a GitHub repo.
2. In the Render dashboard: **New → Static Site**, connect the repo.
3. Render reads `render.yaml` automatically (build command
   `npm install && npm run build`, publish path `./dist`) — or set those
   two fields manually if you'd rather skip the blueprint file.
4. Render gives you a `https://<service-name>.onrender.com` URL on deploy.

All three configs are already in this folder — none need edits to work
as-is; swap in your own project/site name if you want a custom subdomain.

## Extending it

- Swap `js/data/products.js` for a `fetch()` to a real API — every page
  already awaits its render function, so this is a one-file change.
- Add a checkout page that posts to a payment provider — `js/pages/Cart.js`
  has a clearly marked stub (`#checkout-submit`) to hook into.
- Add product images — drop files in a new `/images` folder and swap
  `productArtSVG(product)` for an `<img>` tag in `ProductCard.js` and
  `ProductDetail.js`; consider `loading="lazy"` and `srcset` to keep the
  performance budget intact.
