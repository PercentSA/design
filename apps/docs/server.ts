// Production server for the docs: static files from build/client, then React Router. Runs on Bun.
import { resolve, sep } from "node:path";
import { createRequestHandler, type ServerBuild } from "react-router";

const CLIENT = resolve(import.meta.dir, "build/client");
const build = (await import(resolve(import.meta.dir, "build/server/index.js"))) as ServerBuild;
const handle = createRequestHandler(build, process.env.NODE_ENV ?? "production");

async function staticFile(pathname: string) {
  const path = resolve(CLIENT, `.${decodeURIComponent(pathname)}`);
  if (!path.startsWith(CLIENT + sep)) return null;
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  // Hashed build files never change.
  const cache = pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=3600";
  return new Response(file, { headers: { "Cache-Control": cache } });
}

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  async fetch(request) {
    const { pathname } = new URL(request.url);
    const file = request.method === "GET" || request.method === "HEAD" ? await staticFile(pathname).catch(() => null) : null;
    if (file) return file;
    const response = await handle(request);
    // Pages change with every release: caches ask the server each time; the theme comes from a cookie.
    if (!response.headers.has("Cache-Control")) response.headers.set("Cache-Control", "no-cache");
    response.headers.append("Vary", "Cookie");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
    return response;
  },
});
console.log(`Percent docs on http://localhost:${process.env.PORT ?? 3000}`);
