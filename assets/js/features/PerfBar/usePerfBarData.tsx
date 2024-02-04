//
// As the data needs to be updated outside of the React component
// lifecycle, we use a global singleton to store the data. Coupled
// with custome events to trigger updates.
//

import React from "react";

interface PerfBarData {
  pageLoad: number;
  networkRequests: number;
}

var data: PerfBarData = {
  pageLoad: 0,
  networkRequests: 0,
};

export function usePerfBarData() {
  const [pageLoad, setPageLoad] = React.useState(data.pageLoad);
  const [networkRequests, setNetworkRequests] = React.useState(data.networkRequests);

  React.useEffect(() => {
    function updateData() {
      setPageLoad(data.pageLoad);
      setNetworkRequests(data.networkRequests);
    }

    window.addEventListener("perfbar-update", updateData);

    return () => {
      window.removeEventListener("perfbar-update", updateData);
    };
  }, []);

  return {
    pageLoad,
    networkRequests,
  };
}

export function incrementNetworkRequests() {
  setPerfData({ networkRequests: data.networkRequests + 1 });
}

export function setPerfData(newData: Partial<PerfBarData>) {
  Object.assign(data, newData);

  window.dispatchEvent(new Event("perfbar-update"));
}
