import { Dispatch, SetStateAction, useMemo, useState } from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Subscriber } from "@/models/notifications";
import { compareIds } from "@/routes/paths";
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
  sendNotificationsToEveryone?: boolean;
}

export function useSubscriptions(allSubscribers: Subscriber[], opts?: Opts): SubscriptionsState {
  const me = useMe();

  const subscribers = opts?.ignoreMe ? allSubscribers.filter((s) => !compareIds(s.person!.id, me?.id)) : allSubscribers;
  const alwaysNotify = useMemo(
    () => findPrioritySubscribers(subscribers, opts),
    [subscribers, opts?.notifyPrioritySubscribers],
  );

  const initialSelectedSubscribers = useMemo(
    () => findAlreadySelected(subscribers, alwaysNotify),
    [subscribers, alwaysNotify],
  );

  const [selectedSubscribers, setSelectedSubscribers] = useState<Subscriber[]>(initialSelectedSubscribers);
  const [subscriptionType, setSubscriptionType] = useState<Options>(() =>
    determineInitialSubscriptionType(opts, initialSelectedSubscribers, alwaysNotify),
  );

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

function determineInitialSubscriptionType(
  opts: Opts | undefined,
  selectedSubscribers: Subscriber[],
  alwaysNotify: Subscriber[],
): Options {
  if (opts?.sendNotificationsToEveryone === true) {
    return Options.ALL;
  }

  if (opts?.sendNotificationsToEveryone === false) {
    const additionalSelected = selectedSubscribers.filter(
      (subscriber) => !isSubscriberInList(alwaysNotify, subscriber),
    );

    return additionalSelected.length > 0 ? Options.SELECTED : Options.NONE;
  }

  return Options.ALL;
}

function isSubscriberInList(list: Subscriber[], subscriber: Subscriber) {
  return list.some((item) => compareIds(item.person?.id, subscriber.person?.id));
}
