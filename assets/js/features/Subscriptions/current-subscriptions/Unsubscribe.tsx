import React from "react";

import { useUnsubscribeFromNotifications } from "@/models/notifications";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";
import { SecondaryButton } from "@/components/Buttons";

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
        <SecondaryButton onClick={handleUnsubscribe} loading={loading} size="xs">
          Unsubscribe me
        </SecondaryButton>
      </div>
    </div>
  );
}
