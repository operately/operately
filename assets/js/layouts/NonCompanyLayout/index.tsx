import * as React from "react";

import { DevBar } from "@/features/DevBar";
import { useScrollToTopOnNavigationChange } from "@/hooks/useScrollToTopOnNavigationChange";
import { LoadedDataPageProvider } from "@/routes/loadedData";

export default function NonCompanyLayout({ children }) {
  const outletDiv = React.useRef<HTMLDivElement>(null);

  useScrollToTopOnNavigationChange({ outletDiv });

  return (
    <div className="flex flex-col h-dvh">
      <LoadedDataPageProvider>
        <div className="flex-1 overflow-y-auto" ref={outletDiv}>
          {children}
        </div>
        <DevBar />
      </LoadedDataPageProvider>
    </div>
  );
}
