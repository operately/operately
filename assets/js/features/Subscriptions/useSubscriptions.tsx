import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { NotifiablePerson, Options } from ".";
import { includesId } from "@/routes/paths";

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
  alreadySelected?: NotifiablePerson[];
}

export function useSubscriptions(people: NotifiablePerson[], opts?: Opts): SubscriptionsState {
  const alwaysNotify = useMemo(() => opts?.alwaysNotify || [], []);
  const alreadySelected = getAlreadySelected(alwaysNotify, opts?.alreadySelected || []);

  const [selectedPeople, setSelectedPeople] = useState<NotifiablePerson[]>(alreadySelected);
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
    alwaysNotify,
    currentSubscribersList,
  };
}

function getAlreadySelected(alwaysNotify: NotifiablePerson[], alreadySelected: NotifiablePerson[]) {
  const result = [...alwaysNotify];
  const ids = alwaysNotify.map((p) => p.id);

  alreadySelected.forEach((p) => {
    if (!includesId(ids, p.id)) {
      result.push(p);
    }
  });

  return result;
}
