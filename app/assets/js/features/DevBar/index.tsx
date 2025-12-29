import React from "react";

import classNames from "classnames";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { ToggleTestIds } from "./ToggleTestIds";
import { useDevBarData } from "./useDevBarData";

export function DevBar() {
  if (!window.appConfig.showDevBar) return;

  const { pageName, loadTime, isVisible } = useDevBarData();

  if (!isVisible) return;

  const [isExpanded, setIsExpanded] = useStateWithLocalStorage<boolean>("devBar", "isExpanded", true);

  const className = classNames(
    "fixed",
    "bottom-0 left-0",
    "bg-black text-white-1 text-xs font-mono z-50",
    "hidden lg:block", // hidden on mobile, start showing on large screens
    "cursor-pointer",
  );

  const pageLoadColor = loadTime < 500 ? "text-green-500" : "text-content-error";

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={className} onClick={handleToggle}>
      {isExpanded ? (
        <div className="p-1">
          <div className="flex justify-between mb-1">
            <div className="w-20">Page Name:</div>
            <div>{pageName}</div>
          </div>

          <div className="flex justify-between mb-1">
            <div className="w-20">Load Time:</div>
            <div className={pageLoadColor}>{loadTime.toFixed(0)}ms</div>
          </div>

          <ToggleTestIds />
        </div>
      ) : (
        <div className="flex items-center justify-center px-2 py-2 h-10">
          <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-white-1 transform scale-125" />
        </div>
      )}
    </div>
  );
}
