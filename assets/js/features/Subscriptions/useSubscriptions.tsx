import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { NotifiablePerson, Options } from ".";

export interface SubscriptionsState {
  people: NotifiablePerson[];
  selectedPeople: NotifiablePerson[];
  setSelectedPeople: Dispatch<SetStateAction<NotifiablePerson[]>>;
  subscriptionType: Options;
  setSubscriptionType: Dispatch<SetStateAction<Options>>;
  alwaysNotify: NotifiablePerson[];
  currentSubscribersList: string[];
}

interface Opts {
  alwaysNotify?: NotifiablePerson[];
}

export function useSubscriptions(people: NotifiablePerson[], opts?: Opts): SubscriptionsState {
  const alwaysNotify = opts?.alwaysNotify ? [...opts.alwaysNotify] : [];

  const [selectedPeople, setSelectedPeople] = useState<NotifiablePerson[]>(alwaysNotify);
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
