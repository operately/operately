import React from "react";

import { useLocation } from "react-router-dom";

export function useScrollToTopOnNavigationChange({ outletDiv }: { outletDiv: React.RefObject<HTMLDivElement> }) {
  const { pathname } = useLocation();

  return React.useLayoutEffect(() => {
    if (!outletDiv.current) return;

    outletDiv.current.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, outletDiv]);
}
