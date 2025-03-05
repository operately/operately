import * as React from "react";

import { useLoadedData, useRefresh } from "./loader";
import { CurrentSubscriptions } from "@/features/Subscriptions";

export function Subscriptions() {
  const refresh = useRefresh();
  const { update } = useLoadedData();

  return (
    <div className="border-t border-stroke-base mt-16 pt-8">
      <CurrentSubscriptions
        subscriptionList={update.subscriptionList!}
        potentialSubscribers={update.potentialSubscribers!}
        name="update"
        type="goal_update"
        callback={refresh}
      />
    </div>
  );
}
