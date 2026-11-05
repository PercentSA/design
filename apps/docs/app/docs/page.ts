import type { Localized } from "@percentsa/ui";

export type Group =
  | "brand"
  | "text"
  | "layout"
  | "actions"
  | "forms"
  | "saudi-forms"
  | "overlays"
  | "feedback"
  | "navigation"
  | "data"
  | "boards"
  | "charts"
  | "app"
  | "business"
  | "saudi"
  | "motion"
  | "utilities";

export type DocPage = {
  slug: string;
  name: string;
  group: Group;
  /** Names exported from the package, for the import line. */
  imports: string;
  pkg?: "ui" | "motion" | "ui/react-hook-form";
  examples: string[];
  desc: Localized;
};

export const p = (slug: string, name: string, group: Group, imports: string, examples: string[], en: string, ar: string, pkg: NonNullable<DocPage["pkg"]> = "ui"): DocPage => ({
  slug,
  name,
  group,
  imports,
  examples,
  desc: { en, ar },
  pkg,
});
