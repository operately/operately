import { createContext, useContext } from "react";
import { CurrentSubscriptionsProps } from "./CurrentSubscriptions";

export const CurrentSubscriptionsContext = createContext<CurrentSubscriptionsProps | undefined>(undefined);

export function useCurrentSubscriptionsContext() {
  const context = useContext(CurrentSubscriptionsContext);

  if (context === undefined) {
    throw Error("useCurrentSubscriptionsContext must be used within a CurrentSubscriptionsContext.Provider");
  }

  return context;
}
