import React from "react";

import { GhostButton } from "@/components/Buttons";
import { useSubscribeToNotifications } from "@/models/notifications";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";

export function Subscribe() {
  const { subscriptionList, type, callback } = useCurrentSubscriptionsContext();
  const [subscribe, { loading }] = useSubscribeToNotifications();

  const handleSubscribe = () => {
    subscribe({ id: subscriptionList.id, type }).then(() => callback());
  };

  return (
    <div>
      <div className="font-bold">You&apos;re not subscribed</div>
      <p className="text-sm">You won&apos;t be notified when comments are posted.</p>
      <div className="flex mt-2">
        <GhostButton onClick={handleSubscribe} loading={loading} size="xs" type="secondary">
          Subscribe me
        </GhostButton>
      </div>
    </div>
  );
}
