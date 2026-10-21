import { cn } from "../lib/cn";

export const FIELD_BOX =
  "w-full min-w-0 rounded-field border border-line-strong bg-surface text-base text-fg transition-colors hover:border-fg-3 aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-50";
export const TEXT_BOX = cn(FIELD_BOX, "h-(--p-control-h) px-(--p-control-px) placeholder:text-fg-3");

export const MENU_ITEM =
  "relative flex cursor-default items-center gap-2 rounded-lg py-2 ps-3 pe-8 text-sm text-fg-2 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-fg/10 data-highlighted:text-fg";
