import * as React from "react";

import { Outlet } from "react-router-dom";

import { DevBar } from "@/features/DevBar";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";

export default function NonCompanyLayout() {
  const outletDiv = React.useRef<HTMLDivElement>(null);

  useScrollToTopOnNavigationChange({ outletDiv });

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto" ref={outletDiv}>
        <Outlet />
      </div>
      <DevBar />
    </div>
  );
}
