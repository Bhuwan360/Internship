// Production build: bundles the ES module graph into one minified JS file,
// concatenates + minifies the CSS layer, and copies a dist-ready index.html.
// Run: npm install && npm run build   ->  output in /dist

import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");

if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(join(dist, "js"), { recursive: true });
mkdirSync(join(dist, "css"), { recursive: true });

// 1. Bundle + minify JS (tree-shaken, single file, cache-friendly hash-free
//    name kept stable so deploy configs don't need per-build edits).
await build({
  entryPoints: [join(root, "js/app.js")],
  bundle: true,
  minify: true,
  format: "esm",
  target: ["es2020"],
  outfile: join(dist, "js/app.min.js"),
  legalComments: "none",
});

// 2. Concatenate + minify CSS in load order, then run through esbuild's CSS
//    minifier for a single small stylesheet (fewer render-blocking requests).
const cssFiles = ["variables.css", "base.css", "layout.css", "components.css", "animations.css"];
const combined = cssFiles.map((f) => readFileSync(join(root, "css", f), "utf8")).join("\n");
const tmpCss = join(dist, "css/_combined.css");
writeFileSync(tmpCss, combined);

await build({
  entryPoints: [tmpCss],
  minify: true,
  outfile: join(dist, "css/app.min.css"),
  loader: { ".css": "css" },
});
rmSync(tmpCss);

// 3. Emit a dist index.html pointing at the bundled, minified assets.
let html = readFileSync(join(root, "index.html"), "utf8");
html = html
  .replace(
    /\s*<link rel="stylesheet" href="css\/[a-z]+\.css" \/>\n/g,
    ""
  )
  .replace(
    '<link rel="icon"',
    '<link rel="stylesheet" href="css/app.min.css" />\n  <link rel="icon"'
  )
  .replace('<script type="module" src="js/app.js"></script>', '<script type="module" src="js/app.min.js"></script>');
writeFileSync(join(dist, "index.html"), html);

console.log("✔ Build complete → /dist (minified JS + CSS, zero image assets)");
