// Zero-dependency static file server for local development/preview.
// Usage: node scripts/dev-server.js [dirToServe] [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const serveDir = join(root, process.argv[2] || ".");
const port = Number(process.argv[3]) || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split("?")[0]);
    let filePath = join(serveDir, path === "/" ? "index.html" : path);
    const s = await stat(filePath).catch(() => null);
    if (!s || s.isDirectory()) filePath = join(serveDir, "index.html");
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": TYPES[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`DRIFT dev server running at http://localhost:${port}`);
});
