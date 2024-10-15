//
// As the data needs to be updated outside of the React component
// lifecycle, we use a global singleton to store the data. Coupled
// with custome events to trigger updates.
//

import React from "react";

interface PerfBarData {
  pageName: string;
  loadTime: number;
  networkRequests: number;
}

var data: PerfBarData = {
  pageName: "",
  loadTime: 0,
  networkRequests: 0,
};

export function usePerfBarData() {
  const [pageName, setPageName] = React.useState(data.pageName);
  const [loadTime, setLoadTime] = React.useState(data.loadTime);
  const [networkRequests, setNetworkRequests] = React.useState(data.networkRequests);

  React.useEffect(() => {
    function updateData() {
      setPageName(data.pageName);
      setLoadTime(data.loadTime);
      setNetworkRequests(data.networkRequests);
    }

    window.addEventListener("perfbar-update", updateData);

    return () => {
      window.removeEventListener("perfbar-update", updateData);
    };
  }, []);

  return {
    pageName,
    loadTime,
    networkRequests,
  };
}

export function setPerfData(newData: Partial<PerfBarData>) {
  Object.assign(data, newData);

  window.dispatchEvent(new Event("perfbar-update"));
}
