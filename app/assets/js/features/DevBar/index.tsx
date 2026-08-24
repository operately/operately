import React from "react";

import classNames from "classnames";
import { IconChevronDown } from "turboui";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { DevIconButton } from "./DevPill";
import { ToggleTestIds } from "./ToggleTestIds";
import { ToggleTheme } from "./ToggleTheme";
import { useDevBarData } from "./useDevBarData";
import { useDevThemeOverride } from "./useDevThemeOverride";

const FAST_LOAD_MS = 500;
const SLOW_LOAD_MS = 1500;

export function DevBar() {
  if (!window.appConfig.showDevBar) return null;

  return <DevBarContent />;
}

function DevBarContent() {
  // Keep the override active even when the bar is collapsed or hidden.
  const themeOverride = useDevThemeOverride();
  const { pageName, loadTime, isVisible } = useDevBarData();
  const [isExpanded, setIsExpanded] = useStateWithLocalStorage<boolean>("devBar", "isExpanded", true);

  if (!isVisible) return null;
  if (!isExpanded) return <CollapsedHandle onClick={() => setIsExpanded(true)} />;

  const loadTimeStyles = styleForLoadTime(loadTime);

  const className = classNames(
    "fixed bottom-3 left-3 z-50",
    "hidden lg:block", // hidden on mobile, start showing on large screens
    "min-w-[190px] max-w-[280px] rounded-lg border border-shade-2",
    "bg-[rgba(24,24,27,0.92)] backdrop-blur-md shadow-2xl",
    "font-mono text-white-1 select-none",
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-2 px-2.5 pt-2">
        <span className={classNames("h-1.5 w-1.5 shrink-0 rounded-full", loadTimeStyles.dot)} />
        <span className="min-w-0 truncate text-xs font-medium">{pageName || "unknown page"}</span>

        <div className="ml-auto -mr-1 shrink-0">
          <DevIconButton onClick={() => setIsExpanded(false)} title="Collapse dev bar">
            <IconChevronDown size={12} />
          </DevIconButton>
        </div>
      </div>

      <div className="flex items-baseline gap-1 px-2.5 pb-2">
        <span className={classNames("text-sm font-semibold tabular-nums", loadTimeStyles.text)}>
          {loadTime.toFixed(0)}
        </span>
        <span className="text-xxs uppercase tracking-wide text-white-2">ms load</span>
      </div>

      <div className="flex items-center gap-1.5 border-t border-shade-2 px-2.5 py-2">
        <ToggleTheme {...themeOverride} />
        <ToggleTestIds />
      </div>
    </div>
  );
}

function styleForLoadTime(loadTime: number) {
  if (loadTime < FAST_LOAD_MS) return { dot: "bg-emerald-400", text: "text-emerald-400" };
  if (loadTime < SLOW_LOAD_MS) return { dot: "bg-amber-400", text: "text-amber-400" };
  return { dot: "bg-rose-400", text: "text-rose-400" };
}

function CollapsedHandle({ onClick }: { onClick: () => void }) {
  // The wrapper is a larger invisible hit area, so hovering near the tiny
  // triangle is enough to grow it into an easier click target.
  const className = classNames(
    "fixed bottom-0 left-0 z-50",
    "hidden lg:flex items-end justify-start",
    "w-10 h-10 cursor-pointer group",
  );

  const triangleClassName = classNames(
    "w-0 h-0",
    "border-r-transparent border-b-stone-400/70",
    "border-r-[5px] border-b-[5px]",
    "transition-all duration-150",
    "group-hover:border-r-[16px] group-hover:border-b-[16px] group-hover:border-b-stone-500",
  );

  return (
    <div className={className} onClick={onClick} title="Show dev bar">
      <div className={triangleClassName} />
    </div>
  );
}
