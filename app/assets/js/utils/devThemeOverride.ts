import { getLocalStorage, safeGetItem, safeRemoveItem, safeSetItem } from "@/utils/safeLocalStorage";

export type DevThemeOverride = "dark" | "light";

const STORAGE_KEY = "devBar:themeOverride";
const CONTEXT = "devThemeOverride";

export function isDevThemeOverrideEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(window.appConfig?.showDevBar);
}

export function readDevThemeOverride(): DevThemeOverride | null {
  if (!isDevThemeOverrideEnabled()) {
    return null;
  }

  const raw = safeGetItem(getLocalStorage(), STORAGE_KEY, CONTEXT);
  if (raw === "dark" || raw === "light") {
    return raw;
  }

  return null;
}

export function writeDevThemeOverride(mode: DevThemeOverride): void {
  if (!isDevThemeOverrideEnabled()) {
    return;
  }

  safeSetItem(getLocalStorage(), STORAGE_KEY, mode, CONTEXT);
}

export function clearDevThemeOverride(): void {
  if (!isDevThemeOverrideEnabled()) {
    return;
  }

  safeRemoveItem(getLocalStorage(), STORAGE_KEY, CONTEXT);
}

export function applyColorMode(mode: DevThemeOverride): void {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(mode);
}

export function getSystemColorMode(): DevThemeOverride {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveAccountColorMode(theme: "dark" | "light" | "system"): DevThemeOverride {
  return theme === "system" ? getSystemColorMode() : theme;
}
