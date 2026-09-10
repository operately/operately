import { type Subscriber, type SubscriptionList, type SubscriptionParentType } from "@/api";
import {
  useSubscribeToResource,
  useUnsubscribeFromResource,
  useUpdateSubscriptionsList,
} from "./subscriptionLifecycle";

interface UseCurrentSubscriptionsQueryAdapterOptions {
  potentialSubscribers: Subscriber[];
  subscriptionList?: SubscriptionList | null;
  resourceName: string;
  type: SubscriptionParentType;
  onRefresh: () => Promise<void>;
}

export function useCurrentSubscriptionsQueryAdapter({
  potentialSubscribers,
  subscriptionList,
  resourceName,
  type,
  onRefresh,
}: UseCurrentSubscriptionsQueryAdapterOptions) {
  const subscribe = useSubscribeToResource();
  const unsubscribe = useUnsubscribeFromResource();
  const edit = useUpdateSubscriptionsList();

  async function onSubscribe() {
    if (!subscriptionList) return;
    await subscribe.mutateAsync({ subscriptionListId: subscriptionList.id, type });
    await onRefresh();
  }

  async function onUnsubscribe() {
    if (!subscriptionList) return;
    await unsubscribe.mutateAsync({ subscriptionListId: subscriptionList.id });
    await onRefresh();
  }

  async function onEditSubscribers(subscriberIds: string[]) {
    if (!subscriptionList) return;
    await edit.mutateAsync({ subscriptionListId: subscriptionList.id, subscriberIds, type });
    await onRefresh();
  }

  return {
    subscribers: potentialSubscribers,
    subscribedPeople: potentialSubscribers.filter((s) => s.isSubscribed),
    resourceName,
    isSubscribeLoading: subscribe.isPending,
    isUnsubscribeLoading: unsubscribe.isPending,
    onSubscribe,
    onUnsubscribe,
    onEditSubscribers,
  };
}
