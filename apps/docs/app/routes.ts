import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/redirect.tsx"),
  route("healthz", "routes/healthz.ts"),
  route("r/:file", "routes/registry.ts"),
  layout("routes/docs-layout.tsx", [
    route(":lang", "routes/home.tsx"),
    route(":lang/all", "routes/all.tsx"),
    route(":lang/changelog", "routes/changelog.tsx"),
    route(":lang/foundations/:page", "routes/foundation.tsx"),
    route(":lang/components/:slug", "routes/component.tsx"),
    route(":lang/*", "routes/not-found.tsx"),
  ]),
] satisfies RouteConfig;
