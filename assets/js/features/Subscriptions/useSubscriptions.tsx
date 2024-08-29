import { Dispatch, SetStateAction, useState } from "react";
import { Options } from ".";
import { Person } from "@/models/people";

export interface SubscriptionsState {
  people: Person[];
  selectedPeople: Person[];
  setSelectedPeople: Dispatch<SetStateAction<Person[]>>;
  subscriptionType: Options;
  setSubscriptionType: Dispatch<SetStateAction<Options>>;
}

export function useSubscriptions(people: Person[]): SubscriptionsState {
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [subscriptionType, setSubscriptionType] = useState(Options.ALL);

  return {
    people,
    selectedPeople,
    setSelectedPeople,
    subscriptionType,
    setSubscriptionType,
  };
}
