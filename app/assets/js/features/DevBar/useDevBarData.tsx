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

  // Initialize visibility state from localStorage, default to true if not found
  const [isVisible, setIsVisible] = React.useState(() => {
    try {
      const saved = localStorage.getItem("devbar-visible");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Update data from global state
  React.useEffect(() => {
    function updateData() {
      setPageName(data.pageName);
      setLoadTime(data.loadTime);
      setNetworkRequests(data.networkRequests);
    }

    window.addEventListener(EVENT_NAME, updateData);
    return () => window.removeEventListener(EVENT_NAME, updateData);
  }, []);

  // Save visibility state to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("devbar-visible", JSON.stringify(isVisible));
    } catch {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }, [isVisible]);

  // Handle keyboard shortcut (Cmd/Ctrl + Shift + D)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    pageName,
    loadTime,
    networkRequests,
    isVisible,
    setIsVisible,
  };
}

export function setDevData(newData: Partial<DevBarData>) {
  Object.assign(data, newData);
  window.dispatchEvent(new Event(EVENT_NAME));
}
