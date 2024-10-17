//
// As the data needs to be updated outside of the React component
// lifecycle, we use a global singleton to store the data. Coupled
// with custome events to trigger updates.
//

import React from "react";

interface DevBarData {
  pageName: string;
  loadTime: number;
  networkRequests: number;
}

var data: DevBarData = {
  pageName: "",
  loadTime: 0,
  networkRequests: 0,
};

const EVENT_NAME = "devbar-update";

export function useDevBarData() {
  const [pageName, setPageName] = React.useState(data.pageName);
  const [loadTime, setLoadTime] = React.useState(data.loadTime);
  const [networkRequests, setNetworkRequests] = React.useState(data.networkRequests);

  React.useEffect(() => {
    function updateData() {
      setPageName(data.pageName);
      setLoadTime(data.loadTime);
      setNetworkRequests(data.networkRequests);
    }

    window.addEventListener(EVENT_NAME, updateData);
    return () => window.removeEventListener(EVENT_NAME, updateData);
  }, []);

  return {
    pageName,
    loadTime,
    networkRequests,
  };
}

export function setDevData(newData: Partial<DevBarData>) {
  Object.assign(data, newData);
  window.dispatchEvent(new Event(EVENT_NAME));
}
