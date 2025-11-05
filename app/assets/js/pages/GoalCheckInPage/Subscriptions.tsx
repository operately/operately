import * as React from "react";

import { useLoadedData, useRefresh } from "./loader";
import { CurrentSubscriptions } from "turboui";
import { useCurrentSubscriptionsAdapter } from "@/models/subscriptions";

export function Subscriptions() {
  const refresh = useRefresh();
  const { update } = useLoadedData();

  if (!update.potentialSubscribers || !update.subscriptionList) {
    return null;
  }

  const subscriptionsState = useCurrentSubscriptionsAdapter({
    potentialSubscribers: update.potentialSubscribers,
    subscriptionList: update.subscriptionList,
    resourceName: "check-in",
    type: "project_check_in",
    onRefresh: refresh,
  });

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions {...subscriptionsState} />
    </div>
  );
}
