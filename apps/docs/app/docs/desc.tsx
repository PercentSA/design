import { Fragment } from "react";
import { Code } from "@percentsa/ui";

/** A page description: `name` parts are code names (prop or value). A name never breaks across lines. */
export const Desc = ({ text }: { text: string }) => (
  <>{text.split("`").map((part, i) => (i % 2 ? <Code key={i} className="whitespace-nowrap">{part}</Code> : <Fragment key={i}>{part}</Fragment>))}</>
);

/** The description as plain text (meta tags). */
export const plainDesc = (text: string) => text.replaceAll("`", "");
