import React from "react";

import { IconDeviceLaptop, IconMoon, IconSun } from "turboui";
import { DevThemeOverride } from "@/utils/devThemeOverride";
import { DevPill } from "./DevPill";

interface Props {
  override: DevThemeOverride | null;
  colorMode: DevThemeOverride;
  setOverride: (mode: DevThemeOverride | null) => void;
}

type Mode = DevThemeOverride | "auto";

const ICONS = {
  auto: IconDeviceLaptop,
  light: IconSun,
  dark: IconMoon,
};

export function ToggleTheme({ override, setOverride }: Props) {
  const mode: Mode = override ?? "auto";
  const next = nextMode(mode);
  const Icon = ICONS[mode];

  return (
    <DevPill
      active={Boolean(override)}
      onClick={() => setOverride(next === "auto" ? null : next)}
      title={`Theme: ${mode === "auto" ? "following the account setting" : "overridden"} — click for ${next}`}
    >
      <Icon size={12} />
      {mode}
    </DevPill>
  );
}

function nextMode(mode: Mode): Mode {
  switch (mode) {
    case "auto":
      return "light";
    case "light":
      return "dark";
    case "dark":
      return "auto";
  }
}
