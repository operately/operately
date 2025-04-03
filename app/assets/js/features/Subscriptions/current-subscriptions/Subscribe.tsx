import React from "react";

import { SecondaryButton } from "@/components/Buttons";
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
        <SecondaryButton onClick={handleSubscribe} loading={loading} size="xs" testId="subscribe">
          Subscribe me
        </SecondaryButton>
      </div>
    </div>
  );
}
