import { Fragment } from "react";
import { Code } from "@percentsa/ui";

/** A page description: `name` parts are code names (prop or value). */
export const Desc = ({ text }: { text: string }) => (
  <>{text.split("`").map((part, i) => (i % 2 ? <Code key={i}>{part}</Code> : <Fragment key={i}>{part}</Fragment>))}</>
);

/** The description as plain text (meta tags). */
export const plainDesc = (text: string) => text.replaceAll("`", "");
