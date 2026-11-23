// Look shared by the triggers of Tabs and RouteTabs.
export const TAB_BASE = "border-b-2 border-transparent pb-3 text-sm font-medium whitespace-nowrap text-fg-3 transition-colors hover:text-fg-2";
// The scroll row of Tabs and RouteTabs. 4 px block padding keep the focus ring inside the scroll box; the negative margin keeps the layout. The line sits 4 px above the bottom edge, at the foot of the tabs.
export const TAB_ROW =
  "relative isolate -my-1 flex gap-6 overflow-x-auto bg-[linear-gradient(var(--p-line),var(--p-line))] bg-size-[100%_1px] bg-position-[0_calc(100%-4px)] bg-no-repeat py-1";
