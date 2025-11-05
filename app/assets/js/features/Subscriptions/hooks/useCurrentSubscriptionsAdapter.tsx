import { useMemo } from "react";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";
import {
  Subscriber,
  SubscriptionList,
  useSubscribeToNotifications,
  useUnsubscribeFromNotifications,
  useEditSubscriptionsList,
} from "@/models/notifications";
import { SubscriptionParentType } from "@/api";

interface UseCurrentSubscriptionsAdapterOpts {
  potentialSubscribers: Subscriber[];
  subscriptionList: SubscriptionList;
  resourceName: string;
  type: SubscriptionParentType;
  onRefresh: () => void;
}

interface CurrentSubscriptionsAdapterState {
  subscribers: Subscriber[];
  subscribedPeople: Subscriber[];
  isCurrentUserSubscribed: boolean;
  resourceName: string;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onEditSubscribers: (subscriberIds: string[]) => void;
  isSubscribeLoading: boolean;
  isUnsubscribeLoading: boolean;
}

/**
 * Adapter hook that prepares data and callbacks for the TurboUI CurrentSubscriptions component.
 * Handles all backend interactions and state management.
 */
export function useCurrentSubscriptionsAdapter({
  potentialSubscribers,
  subscriptionList,
  resourceName,
  type,
  onRefresh,
}: UseCurrentSubscriptionsAdapterOpts): CurrentSubscriptionsAdapterState {
  const me = useMe();
  const [subscribe, { loading: subscribeLoading }] = useSubscribeToNotifications();
  const [unsubscribe, { loading: unsubscribeLoading }] = useUnsubscribeFromNotifications();
  const [editSubscribers] = useEditSubscriptionsList();

  const subscribedPeople = useMemo(
    () => potentialSubscribers.filter((s) => s.isSubscribed),
    [potentialSubscribers],
  );

  const isCurrentUserSubscribed = useMemo(
    () => subscribedPeople.some((s) => s.person && compareIds(s.person.id, me?.id)),
    [subscribedPeople, me?.id],
  );

  const handleSubscribe = () => {
    subscribe({
      id: subscriptionList.id,
      type,
    }).then(() => onRefresh());
  };

  const handleUnsubscribe = () => {
    unsubscribe({
      id: subscriptionList.id,
    }).then(() => onRefresh());
  };

  const handleEditSubscribers = (subscriberIds: string[]) => {
    editSubscribers({
      id: subscriptionList.id,
      subscriberIds,
      type,
    }).then(() => onRefresh());
  };

  return {
    subscribers: potentialSubscribers,
    subscribedPeople,
    isCurrentUserSubscribed,
    resourceName,
    onSubscribe: handleSubscribe,
    onUnsubscribe: handleUnsubscribe,
    onEditSubscribers: handleEditSubscribers,
    isSubscribeLoading: subscribeLoading,
    isUnsubscribeLoading: unsubscribeLoading,
  };
}
