import { useMemo, useState } from "react";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { Subscriber } from "@/models/notifications";
import { compareIds } from "@/routes/paths";
import { SubscribersSelector } from "turboui";

type LabelContext =
  | { projectName: string }
  | { spaceName: string }
  | { resourceHubName: string };

type UseSubscriptionsAdapterOpts = {
  notifyPrioritySubscribers?: boolean;
  ignoreMe?: boolean;
  sendNotificationsToEveryone?: boolean;
} & LabelContext;

export interface SubscriptionsAdapterState {
  subscribers: Subscriber[];
  selectedSubscribers: Subscriber[];
  onSelectedSubscribersChange: (subscribers: Subscriber[]) => void;
  subscriptionType: SubscribersSelector.SubscriptionOption;
  onSubscriptionTypeChange: (type: SubscribersSelector.SubscriptionOption) => void;
  alwaysNotify: Subscriber[];
  currentSubscribersList: string[];
  allSubscribersLabel: string;
}

/**
 * Adapter hook that bridges the old useSubscriptions API with the new TurboUI components.
 * This maintains backward compatibility while using the new component architecture.
 */
export function useSubscriptionsAdapter(
  allSubscribers: Subscriber[],
  opts: UseSubscriptionsAdapterOpts,
): SubscriptionsAdapterState {
  const me = useMe();

  const subscribers = opts.ignoreMe
    ? allSubscribers.filter((s) => !compareIds(s.person!.id, me?.id))
    : allSubscribers;

  const alwaysNotify = useMemo(
    () => findPrioritySubscribers(subscribers, opts),
    [subscribers, opts.notifyPrioritySubscribers],
  );

  const initialSelectedSubscribers = useMemo(
    () => findAlreadySelected(subscribers, alwaysNotify),
    [subscribers, alwaysNotify],
  );

  const [selectedSubscribers, setSelectedSubscribers] = useState<Subscriber[]>(initialSelectedSubscribers);
  const [subscriptionType, setSubscriptionType] = useState<SubscribersSelector.SubscriptionOption>(() =>
    determineInitialSubscriptionType(opts, initialSelectedSubscribers, alwaysNotify),
  );

  const currentSubscribersList = useMemo(() => {
    switch (subscriptionType) {
      case SubscribersSelector.SubscriptionOption.ALL:
        return subscribers.map((subscriber) => subscriber.person!.id!);
      case SubscribersSelector.SubscriptionOption.SELECTED:
        return selectedSubscribers.map((subscriber) => subscriber.person!.id!);
      case SubscribersSelector.SubscriptionOption.NONE:
        return alwaysNotify.map((subscriber) => subscriber.person!.id!);
    }
  }, [subscriptionType, selectedSubscribers, subscribers, alwaysNotify]);

  const allSubscribersLabel = useMemo(
    () => buildAllSubscribersLabel(subscribers, opts),
    [subscribers, opts],
  );

  return {
    subscribers,
    selectedSubscribers,
    onSelectedSubscribersChange: setSelectedSubscribers,
    subscriptionType,
    onSubscriptionTypeChange: setSubscriptionType,
    alwaysNotify,
    currentSubscribersList,
    allSubscribersLabel,
  };
}

function findPrioritySubscribers(subscribers: Subscriber[], opts: UseSubscriptionsAdapterOpts) {
  if (!opts.notifyPrioritySubscribers) return [];
  return subscribers.filter((subscriber) => subscriber.priority);
}

function findAlreadySelected(subscribers: Subscriber[], alwaysNotify: Subscriber[]) {
  const alreadySubscribed = subscribers.filter((subscriber) => subscriber.isSubscribed);
  return [...alwaysNotify, ...alreadySubscribed];
}

function determineInitialSubscriptionType(
  opts: UseSubscriptionsAdapterOpts,
  selectedSubscribers: Subscriber[],
  alwaysNotify: Subscriber[],
): SubscribersSelector.SubscriptionOption {
  if (opts.sendNotificationsToEveryone === true) {
    return SubscribersSelector.SubscriptionOption.ALL;
  }

  if (opts.sendNotificationsToEveryone === false) {
    const additionalSelected = selectedSubscribers.filter(
      (subscriber) => !isSubscriberInList(alwaysNotify, subscriber),
    );
    return additionalSelected.length > 0 ? SubscribersSelector.SubscriptionOption.SELECTED : SubscribersSelector.SubscriptionOption.NONE;
  }

  return SubscribersSelector.SubscriptionOption.ALL;
}

function isSubscriberInList(list: Subscriber[], subscriber: Subscriber) {
  return list.some((item) => compareIds(item.person?.id, subscriber.person?.id));
}

function buildAllSubscribersLabel(subscribers: Subscriber[], opts: UseSubscriptionsAdapterOpts): string {
  const count = subscribers.length;
  const part1 = count > 1 ? `All ${count} people` : "The 1 person";

  let part2 = "";
  if ("projectName" in opts) {
    part2 = ` contributing to ${opts.projectName}`;
  } else if ("spaceName" in opts) {
    part2 = ` who are members of the ${opts.spaceName} space`;
  } else if ("resourceHubName" in opts) {
    part2 = ` who have access to ${opts.resourceHubName}`;
  }

  return part1 + part2;
}
