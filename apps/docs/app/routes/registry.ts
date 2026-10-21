import type { Route } from "./+types/registry";
import REGISTRY from "~/registry.generated.json";

// shadcn registry items (/r/button.json): each holds the source of its files.
export function loader({ params }: Route.LoaderArgs) {
  const key = params.file.replace(/\.json$/, "");
  // Own keys only: "toString" or "__proto__" are not items.
  const item = Object.hasOwn(REGISTRY, key) ? (REGISTRY as Record<string, unknown>)[key] : undefined;
  if (!item) throw new Response("Not Found", { status: 404 });
  return Response.json(item, { headers: { "Cache-Control": "no-cache" } });
}
