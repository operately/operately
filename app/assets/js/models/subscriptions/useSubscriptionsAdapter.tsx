import { useTranslation } from "react-i18next";
import { tn } from "@/i18n";
import { useMemo, useState } from "react";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { Subscriber } from "@/models/notifications";
import { compareIds } from "@/routes/paths";
import { SubscribersSelector } from "turboui";

type LabelContext =
  | { projectName: string }
  | { spaceName: string }
  | { resourceHubName: string }
  | { goalName: string };

type UseSubscriptionsAdapterOpts = {
  notifyPrioritySubscribers?: boolean;
  ignoreMe?: boolean;
  sendNotificationsToEveryone?: boolean;
} & LabelContext;

interface SubscriptionsAdapterState extends SubscribersSelector.Props {
  currentSubscribersList: string[];
  notifyEveryone: boolean;
}

export { SubscriptionsAdapterState as SubscriptionsState };

/**
 * Adapter hook that prepares data and callbacks for the TurboUI SubscribersSelector component.
 * Handles state management for subscription options and selected subscribers.
 */
export function useSubscriptionsAdapter(
  allSubscribers: Subscriber[],
  opts: UseSubscriptionsAdapterOpts,
): SubscriptionsAdapterState {
  useTranslation();
  const me = useMe();

  const subscribers = opts.ignoreMe ? allSubscribers.filter((s) => !compareIds(s.person!.id, me?.id)) : allSubscribers;

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

  const allSubscribersLabel = buildAllSubscribersLabel(subscribers, opts);

  return {
    subscribers,
    selectedSubscribers,
    onSelectedSubscribersChange: setSelectedSubscribers,
    subscriptionType,
    onSubscriptionTypeChange: setSubscriptionType,
    alwaysNotify,
    currentSubscribersList,
    allSubscribersLabel,
    notifyEveryone: subscriptionType === SubscribersSelector.SubscriptionOption.ALL,
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
    return additionalSelected.length > 0
      ? SubscribersSelector.SubscriptionOption.SELECTED
      : SubscribersSelector.SubscriptionOption.NONE;
  }

  return SubscribersSelector.SubscriptionOption.ALL;
}

function isSubscriberInList(list: Subscriber[], subscriber: Subscriber) {
  return list.some((item) => compareIds(item.person?.id, subscriber.person?.id));
}

function buildAllSubscribersLabel(subscribers: Subscriber[], opts: UseSubscriptionsAdapterOpts): string {
  const count = subscribers.length;
  // This label is only displayed when recipients exist; retain its legacy zero-count fallback.
  const displayCount = Math.max(1, count);
  if ("projectName" in opts)
    return tn("The 1 person contributing to {{name}}", "All {{count}} people contributing to {{name}}", displayCount, {
      name: opts.projectName,
    });
  if ("spaceName" in opts)
    return tn(
      "The 1 person who are members of the {{name}} space",
      "All {{count}} people who are members of the {{name}} space",
      displayCount,
      { name: opts.spaceName },
    );
  const name = "resourceHubName" in opts ? opts.resourceHubName : opts.goalName;
  return tn(
    "The 1 person who have access to {{name}}",
    "All {{count}} people who have access to {{name}}",
    displayCount,
    { name },
  );
}
