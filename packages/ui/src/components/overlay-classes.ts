// Shared by overlays.tsx and actions.tsx (actions.tsx cannot import overlays.tsx: overlays.tsx imports Button).
export const BACKDROP = "p-overlay fixed inset-0 z-(--p-z-overlay) bg-bg/70 backdrop-blur-sm";
export const PANEL = "border border-line bg-surface-2 text-fg shadow-overlay";
export const CLOSE = "absolute end-4 top-4 grid size-9 place-items-center rounded-pill text-fg-3 transition-colors hover:bg-surface hover:text-fg [&_svg]:size-4";
export const TOOLTIP = "p-float z-(--p-z-overlay) rounded-lg bg-fg px-2.5 py-1.5 text-xs font-medium text-bg";
// A dialog that fills the screen below 768 px (md).
export const FULL_ON_PHONE = "max-md:inset-0 max-md:h-dvh";
// The dialog centered from 768 px (md). The caller adds its own max width (`md:max-w-*`).
export const CENTERED_FROM_MD = "md:start-1/2 md:top-1/2 md:max-h-[calc(100dvh-2rem)] md:w-[calc(100%-2rem)] md:-translate-y-1/2 md:rounded-panel ltr:md:-translate-x-1/2 rtl:md:translate-x-1/2";
