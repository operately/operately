import React from "react";

import { GhostButton } from "@/components/Buttons";
import { useUnsubscribeFromNotifications } from "@/models/notifications";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";

export function Unsubscribe() {
  const { subscriptionList, name, callback } = useCurrentSubscriptionsContext();
  const [unsubscribe, { loading }] = useUnsubscribeFromNotifications();

  const handleUnsubscribe = () => {
    unsubscribe({ id: subscriptionList.id }).then(() => callback());
  };

  return (
    <div>
      <div className="font-bold">You&apos;re subscribed</div>
      <p className="text-sm">You&apos;ll get a notification when someone comments on this {name}.</p>
      <div className="flex mt-2">
        <GhostButton onClick={handleUnsubscribe} loading={loading} size="xs" type="secondary">
          Unsubscribe me
        </GhostButton>
      </div>
    </div>
  );
}
