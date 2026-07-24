import React from "react";

import { useTheme } from "@/contexts/ThemeContext";
import {
  applyColorMode,
  clearDevThemeOverride,
  DevThemeOverride,
  isDevThemeOverrideEnabled,
  readDevThemeOverride,
  resolveAccountColorMode,
  writeDevThemeOverride,
} from "@/utils/devThemeOverride";

export function useDevThemeOverride() {
  const accountTheme = useTheme();
  const [override, setOverrideState] = React.useState<DevThemeOverride | null>(() => readDevThemeOverride());

  useEnforceDevThemeOverride(override);

  const setOverride = React.useCallback(
    (mode: DevThemeOverride | null) => {
      if (!isDevThemeOverrideEnabled()) {
        return;
      }

      if (mode === null) {
        clearDevThemeOverride();
        setOverrideState(null);
        applyColorMode(resolveAccountColorMode(accountTheme));
        return;
      }

      writeDevThemeOverride(mode);
      setOverrideState(mode);
      applyColorMode(mode);
    },
    [accountTheme],
  );

  const colorMode = override ?? resolveAccountColorMode(accountTheme);

  return { override, colorMode, setOverride };
}

function useEnforceDevThemeOverride(override: DevThemeOverride | null) {
  React.useEffect(() => {
    if (!isDevThemeOverrideEnabled() || !override) {
      return;
    }

    const html = document.documentElement;

    const enforce = () => {
      if (!html.classList.contains(override)) {
        applyColorMode(override);
      }
    };

    enforce();

    const observer = new MutationObserver(enforce);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [override]);
}
