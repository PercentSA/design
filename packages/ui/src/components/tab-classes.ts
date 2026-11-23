// Look shared by the triggers of Tabs and RouteTabs. The focus ring is drawn inside the tab, so the scroll row cannot cut it.
export const TAB_BASE = "border-b-2 border-transparent pb-3 text-sm font-medium whitespace-nowrap text-fg-3 transition-colors hover:text-fg-2 focus-visible:-outline-offset-2";
// The scroll row of Tabs and RouteTabs. The line sits at the bottom edge, under the border of the tabs.
export const TAB_ROW =
  "relative isolate flex gap-6 overflow-x-auto bg-[linear-gradient(var(--p-line),var(--p-line))] bg-size-[100%_1px] bg-position-[0_100%] bg-no-repeat";
