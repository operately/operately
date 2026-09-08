import * as React from "react";
import { type SubscriptionList } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { showErrorToast, SidebarNotificationSection } from "turboui";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { PageCache } from "@/routes/PageCache";
import {
  invalidateSubscriptionQueries,
  useSubscribeToResource,
  useUnsubscribeFromResource,
  type SubscriptionEntityType,
} from "./subscriptionLifecycle";

interface UseSubscriptionOptions {
  subscriptionList?: SubscriptionList | null;
  entityId: string;
  entityType: SubscriptionEntityType;
  cacheKey?: string;
  onRefresh?: () => Promise<void>;
}

/** Queues writes per resource while showing the latest toggle. Only server-confirmed
 * state is used for rollback; late responses cannot change another resource's UI.
 */
export function useSubscription({
  subscriptionList,
  entityId,
  entityType,
  cacheKey,
  onRefresh,
}: UseSubscriptionOptions): SidebarNotificationSection.Props {
  const currentUser = useMe();
  const queryClient = useQueryClient();
  const { mutateAsync: subscribe } = useSubscribeToResource();
  const { mutateAsync: unsubscribe } = useUnsubscribeFromResource();
  const serverIsSubscribed = Boolean(
    currentUser &&
      subscriptionList?.subscriptions?.some(
        (subscription) => subscription.person?.id === currentUser.id && subscription.canceled !== true,
      ),
  );
  const session = React.useMemo(
    () => ({
      confirmed: serverIsSubscribed,
      pending: 0,
      queue: Promise.resolve(),
      changed: false,
      refreshing: false,
      awaitingConfirmation: false,
    }),
    // A session survives refreshed props but never follows the user to another resource.
    [entityId, entityType, subscriptionList?.id, currentUser?.id],
  );
  const currentSession = React.useRef(session);
  currentSession.current = session;
  const mounted = React.useRef(false);
  const [optimistic, setOptimistic] = React.useState({ session, value: serverIsSubscribed });

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (session.pending !== 0) return;

    // Parent props can still contain the pre-mutation subscription list.
    if (session.awaitingConfirmation && serverIsSubscribed !== session.confirmed) return;

    session.awaitingConfirmation = false;

    if (session.refreshing) return;

    session.confirmed = serverIsSubscribed;
    setOptimistic({ session, value: serverIsSubscribed });
  }, [session, serverIsSubscribed, subscriptionList]);

  const isCurrent = () => mounted.current && currentSession.current === session;

  const onToggle = async (nextIsSubscribed: boolean) => {
    const subscriptionListId = subscriptionList?.id;
    if (!subscriptionListId || !currentUser) return;

    session.pending += 1;
    if (isCurrent()) setOptimistic({ session, value: nextIsSubscribed });

    const result = session.queue.then(async () => {
      try {
        if (nextIsSubscribed) {
          await subscribe({ subscriptionListId, type: entityType });
        } else {
          await unsubscribe({ subscriptionListId });
        }

        session.confirmed = nextIsSubscribed;
        session.awaitingConfirmation = true;
        session.changed = true;
      } catch (error) {
        if (isCurrent()) {
          console.error(`Failed to toggle ${entityType} subscription`, error);
          showErrorToast(
            "Error",
            nextIsSubscribed
              ? `Failed to subscribe to ${entityType} notifications.`
              : `Failed to unsubscribe from ${entityType} notifications.`,
          );
        }
      }

      session.pending -= 1;

      if (session.pending !== 0) return;
      if (isCurrent()) setOptimistic({ session, value: session.confirmed });
      if (!session.changed) return;

      session.changed = false;
      session.refreshing = true;

      try {
        if (cacheKey) PageCache.invalidate(cacheKey);
        await invalidateSubscriptionQueries(queryClient, entityType);
        if (isCurrent()) await onRefresh?.();
      } catch (error) {
        // The server accepted the toggle; refresh failures must not undo it.
        console.error("Failed to refresh subscriptions after saving", error);
      } finally {
        session.refreshing = false;
      }
    });
    session.queue = result;
    await result;
  };

  const subscribedPeople = (subscriptionList?.subscriptions ?? []).flatMap((subscription) =>
    subscription.canceled !== true && subscription.person ? [subscription.person] : [],
  );

  return {
    isSubscribed: optimistic.session === session ? optimistic.value : serverIsSubscribed,
    onToggle,
    hidden: Boolean(!subscriptionList?.subscriptions || !currentUser),
    entityType,
    subscribedPeople,
  };
}
