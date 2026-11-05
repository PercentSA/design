import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const src = (pkg: string) => fileURLToPath(new URL(`../../packages/${pkg}/src/index.ts`, import.meta.url));
// Only the bare package names: "@percentsa/ui/styles.css" and the token CSS files still resolve to the packages.
const pkg = (name: string) => ({ find: new RegExp(`^@percentsa/${name}$`), replacement: src(name) });

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
    // The docs always show the current source of the packages (no package build needed).
    alias: [
      { find: /^@percentsa\/ui\/react-hook-form$/, replacement: fileURLToPath(new URL("../../packages/ui/src/react-hook-form.tsx", import.meta.url)) },
      pkg("ui"),
      pkg("motion"),
      pkg("tokens"),
    ],
  },
});
