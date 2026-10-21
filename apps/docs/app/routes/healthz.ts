// Container health check, outside the docs layout.
export const loader = () => new Response("ok", { headers: { "Cache-Control": "no-store" } });
