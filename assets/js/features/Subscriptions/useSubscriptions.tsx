import { Dispatch, SetStateAction, useMemo, useState } from "react";

import { useMe } from "@/contexts/CurrentUserContext";
import { compareIds } from "@/routes/paths";
import { Subscriber } from "@/models/notifications";
import { Options } from ".";

export interface SubscriptionsState {
  subscribers: Subscriber[];
  selectedSubscribers: Subscriber[];
  setSelectedSubscribers: Dispatch<SetStateAction<Subscriber[]>>;
  subscriptionType: Options;
  setSubscriptionType: Dispatch<SetStateAction<Options>>;
  alwaysNotify: Subscriber[];
  currentSubscribersList: string[];
}

interface Opts {
  notifyPrioritySubscribers?: boolean;
  ignoreMe?: boolean;
}

export function useSubscriptions(subscribers: Subscriber[], opts?: Opts): SubscriptionsState {
  const me = useMe();

  subscribers = opts?.ignoreMe ? subscribers.filter((s) => !compareIds(s.person!.id, me?.id)) : subscribers;
  const alwaysNotify = useMemo(() => findPrioritySubscribers(subscribers, opts), []);

  const [selectedSubscribers, setSelectedSubscribers] = useState<Subscriber[]>(
    findAlreadySelected(subscribers, alwaysNotify),
  );
  const [subscriptionType, setSubscriptionType] = useState(Options.ALL);

  const currentSubscribersList = useMemo(() => {
    switch (subscriptionType) {
      case Options.ALL:
        return subscribers.map((subscriber) => subscriber.person!.id!);
      case Options.SELECTED:
        return selectedSubscribers.map((subscriber) => subscriber.person!.id!);
      case Options.NONE:
        return alwaysNotify.map((subscriber) => subscriber.person!.id!);
    }
  }, [subscriptionType, selectedSubscribers, subscribers, alwaysNotify]);

  return {
    subscribers,
    selectedSubscribers,
    setSelectedSubscribers,
    subscriptionType,
    setSubscriptionType,
    alwaysNotify,
    currentSubscribersList,
  };
}

function findPrioritySubscribers(subscribers: Subscriber[], opts?: Opts) {
  if (!opts?.notifyPrioritySubscribers) return [];

  return subscribers.filter((subscriber) => subscriber.priority);
}

function findAlreadySelected(subscribers: Subscriber[], alwaysNotify: Subscriber[]) {
  const alreadySubscribed = subscribers.filter((subscriber) => subscriber.isSubscribed);

  return [...alwaysNotify, ...alreadySubscribed];
}
