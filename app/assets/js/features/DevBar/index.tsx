import React from "react";

import classNames from "classnames";
import { ToggleTestIds } from "./ToggleTestIds";
import { useDevBarData } from "./useDevBarData";

export function DevBar() {
  if (!window.appConfig.showDevBar) return;

  const className = classNames(
    "absolute",
    "bottom-0 left-0",
    "bg-black text-white-1 p-1 text-xs font-mono z-50",
    "hidden lg:block", // hidden on mobile, start showing on large screens
  );

  const data = useDevBarData();
  const pageLoadColor = data.loadTime < 500 ? "text-green-500" : "text-content-error";

  return (
    <div className={className}>
      <div className="flex justify-between mb-1">
        <div className="w-20">Page Name:</div>
        <div>{data.pageName}</div>
      </div>

      <div className="flex justify-between mb-3">
        <div className="w-20">Load Time:</div>
        <div className={pageLoadColor}>{data.loadTime.toFixed(0)}ms</div>
      </div>

      <ToggleTestIds />
    </div>
  );
}
