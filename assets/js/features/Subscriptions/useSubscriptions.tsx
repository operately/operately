import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { NotifiablePerson, Options } from ".";
import { Person } from "@/models/people";

export interface SubscriptionsState {
  people: NotifiablePerson[];
  selectedPeople: Person[];
  setSelectedPeople: Dispatch<SetStateAction<Person[]>>;
  subscriptionType: Options;
  setSubscriptionType: Dispatch<SetStateAction<Options>>;
  alwaysNotify: Person[];
  currentSubscribersList: string[];
}

export function useSubscriptions(people: NotifiablePerson[], opts?: { alwaysNotify?: Person[] }): SubscriptionsState {
  const alwaysNotify = opts?.alwaysNotify ? [...opts.alwaysNotify] : [];

  const [selectedPeople, setSelectedPeople] = useState<Person[]>(alwaysNotify);
  const [subscriptionType, setSubscriptionType] = useState(Options.ALL);

  const currentSubscribersList = useMemo(() => {
    switch (subscriptionType) {
      case Options.ALL:
        return people.map((p) => p.id!);
      case Options.SELECTED:
        return selectedPeople.map((p) => p.id!);
      case Options.NONE:
        return alwaysNotify.map((p) => p.id!);
    }
  }, [subscriptionType, selectedPeople, people, alwaysNotify]);

  return {
    people,
    selectedPeople,
    setSelectedPeople,
    subscriptionType,
    setSubscriptionType,
    alwaysNotify: opts?.alwaysNotify || [],
    currentSubscribersList,
  };
}
