import React from "react";

import { Person } from "@/models/people";

enum Options {
  ALL = "all",
  SELECTED = "selected",
  NONE = "none",
}

interface ContextType {
  people: Person[];
  selectedPeople: Person[];
  setSelectedPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  subscriptionType: Options;
  setSubscriptionType: React.Dispatch<React.SetStateAction<Options>>;
}

interface Props {
  children: NonNullable<React.ReactNode>;
  people: Person[];
}

function SubscriptionsProvider({ children, people }: Props) {
  const [selectedPeople, setSelectedPeople] = React.useState<Person[]>([]);
  const [subscriptionType, setSubscriptionType] = React.useState(Options.ALL);

  const data = {
    people,
    selectedPeople,
    setSelectedPeople,
    subscriptionType,
    setSubscriptionType,
  };

  return <SubscriptionsContext.Provider value={data}>{children}</SubscriptionsContext.Provider>;
}

const SubscriptionsContext = React.createContext<ContextType | undefined>(undefined);

function useSubscriptionsContext() {
  const context = React.useContext(SubscriptionsContext);

  if (context === undefined) {
    throw Error("useSubscriptionsContext must be used within a SubscriptionsProvider");
  }

  return context;
}

export { SubscriptionsProvider, useSubscriptionsContext, Options };
