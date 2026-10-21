"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useStrings, useText } from "../provider";
import { SegmentedControl } from "./actions";
import { THEME_KEY } from "./theme-script";

export type ThemeMode = "system" | "light" | "dark";

const MODES: ThemeMode[] = ["system", "light", "dark"];
const isMode = (v: unknown): v is ThemeMode => MODES.includes(v as ThemeMode);

// <html data-theme> is the one source of truth, so every switch on the page shows the same mode.
const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};
const read = () => {
  const t = document.documentElement.dataset.theme;
  return isMode(t) ? t : undefined;
};

const setTheme = (t: ThemeMode) => {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    // Blocked storage (private mode): the mode still applies to this page.
  }
};

/** The mode on <html data-theme> (undefined on the server, before hydration, and when the page sets none), and a setter that also stores it. */
export function useTheme(): [ThemeMode | undefined, (t: ThemeMode) => void] {
  return [useSyncExternalStore(subscribe, read, () => undefined), setTheme];
}

const ICONS = { system: Monitor, light: Sun, dark: Moon };

/** System, Light, Dark. Add THEME_SCRIPT to <head> so the stored choice applies without a flash. */
export function ThemeSwitch({ className }: { className?: string }) {
  const s = useStrings();
  const t = useText();
  const [theme, set] = useTheme();
  const names = { system: s.themeSystem, light: s.themeLight, dark: s.themeDark };
  return (
    <SegmentedControl
      aria-label={s.theme}
      className={className}
      value={theme}
      onValueChange={(v) => isMode(v) && set(v)}
      options={MODES.map((m) => {
        const Icon = ICONS[m];
        return {
          value: m,
          label: (
            <>
              <Icon aria-hidden />
              {t(names[m])}
            </>
          ),
        };
      })}
    />
  );
}
