import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { themeCss, tokensCss, tokensJson } from "./generate";

const out = resolve(import.meta.dir, "../dist");
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, "tokens.css"), tokensCss());
writeFileSync(resolve(out, "theme.css"), themeCss());
writeFileSync(resolve(out, "tokens.json"), JSON.stringify(tokensJson(), null, 2) + "\n");
console.log("tokens: wrote dist/tokens.css, theme.css, tokens.json");
