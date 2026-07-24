import React from "react";

import { DevThemeOverride } from "@/utils/devThemeOverride";

interface Props {
  override: DevThemeOverride | null;
  colorMode: DevThemeOverride;
  setOverride: (mode: DevThemeOverride | null) => void;
}

export function ToggleTheme({ override, colorMode, setOverride }: Props) {
  const statusColor = override ? "text-green-500" : "text-white-1";

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverride(colorMode === "dark" ? "light" : "dark");
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverride(null);
  };

  return (
    <div>
      Theme [
      <span className={`${statusColor} cursor-pointer`} onClick={toggle}>
        {colorMode}
      </span>
      ]
      {override && (
        <>
          {" "}
          <span className="cursor-pointer text-white-2" onClick={reset}>
            reset
          </span>
        </>
      )}
    </div>
  );
}
