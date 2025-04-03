import React, { createContext, useContext } from "react";
import { SubscriptionsState } from "@/features/Subscriptions";

const SubscribersSelectorContext = createContext<SubscriptionsState | undefined>(undefined);

export function SubscribersSelectorProvider({ state, children }) {
  return <SubscribersSelectorContext.Provider value={state}>{children}</SubscribersSelectorContext.Provider>;
}

export function useSubscribersSelectorContext() {
  const context = useContext(SubscribersSelectorContext);

  if (context === undefined) {
    throw Error("useSubscribersSelectorContext must be used within SubscribersSelectorProvider");
  }

  return context;
}
