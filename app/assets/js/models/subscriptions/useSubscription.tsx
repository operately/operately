import * as React from "react";
import Api, { SubscriptionList } from "@/api";
import { showErrorToast, SidebarNotificationSection } from "turboui";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { PageCache } from "@/routes/PageCache";

interface UseSubscriptionOptions {
  subscriptionList?: SubscriptionList | null;
  entityId: string;
  entityType: "project" | "milestone" | "project_task";
  cacheKey: string;
  onRefresh?: () => Promise<void>;
}

export function useSubscription({
  subscriptionList,
  entityId,
  entityType,
  cacheKey,
  onRefresh,
}: UseSubscriptionOptions): SidebarNotificationSection.Props {
  const currentUser = useMe();
  const hidden = Boolean(!subscriptionList?.subscriptions || !currentUser);

  const [isSubscribed, setIsSubscribed] = React.useState(() => {
    if (!subscriptionList?.subscriptions || !currentUser) return false;

    return subscriptionList.subscriptions.some(
      (subscription) => subscription.person?.id === currentUser.id && subscription.canceled !== true,
    );
  });

  const onToggle = React.useCallback(
    async (notSubscribed: boolean) => {
      if (!subscriptionList?.id) return;

      const prevValue = notSubscribed;
      setIsSubscribed(notSubscribed);

      try {
        if (notSubscribed) {
          await Api.subscribeToNotifications({ id: subscriptionList.id, type: entityType });
        } else {
          await Api.unsubscribeFromNotifications({ id: subscriptionList.id });
        }

        PageCache.invalidate(cacheKey);

        await onRefresh?.();
      } catch (error) {
        setIsSubscribed(prevValue);

        console.error(`Failed to toggle ${entityType} subscription`, error);
        showErrorToast(
          "Error",
          prevValue
            ? `Failed to subscribe to ${entityType} notifications.`
            : `Failed to unsubscribe from ${entityType} notifications.`,
        );
      }
    },
    [subscriptionList?.id, entityId, entityType, cacheKey, onRefresh, isSubscribed],
  );

  return {
    isSubscribed,
    onToggle,
    hidden,
    entityType,
  };
}
