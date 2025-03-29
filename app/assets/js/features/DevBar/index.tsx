import React from "react";

import { useDevBarData } from "./useDevBarData";
import { ToggleTestIds } from "./ToggleTestIds";
import { ToggleCompanyOwner } from "./ToggleCompanyOwner";
import classNames from "classnames";

export function DevBar() {
  if (!window.appConfig.showDevBar) return;

  const className = classNames(
    "bg-black text-white-1 p-1 text-sm font-mono z-50",
    "hidden lg:block", // hidden on mobile, start showing on large screens
  );

  return (
    <div className={className}>
      <div className="flex justify-between">
        <Left />
        <Right />
      </div>
    </div>
  );
}

function Left() {
  return (
    <div className="flex items-center gap-6">
      <Name />
      <ToggleTestIds />
      <ToggleCompanyOwner />
    </div>
  );
}

function Name() {
  return <div className="text-green-500">DEVBAR</div>;
}

function Right() {
  const data = useDevBarData();
  const pageLoadColor = data.loadTime < 500 ? "text-green-500" : "text-content-error";

  return (
    <div className="flex items-center gap-8">
      <div>
        Page: <span>{data.pageName}</span>
      </div>

      <div>
        Load Time: <span className={pageLoadColor}>{data.loadTime.toFixed(0)}ms</span>
      </div>

      <div>
        Network Requests: <span className="text-green-500">{data.networkRequests}</span>
      </div>
    </div>
  );
}
