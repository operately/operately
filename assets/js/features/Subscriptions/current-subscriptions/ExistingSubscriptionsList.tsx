import React, { useMemo, useState } from "react";

import { match } from "ts-pattern";
import Avatar from "@/components/Avatar";
import { Subscription } from "@/models/notifications";
import { EditSubscriptionsModal } from "./EditSubscriptionsModal";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";
import { SecondaryButton } from "@/components/Buttons";

export function ExistingSubscriptionsList() {
  const { subscriptionList, name } = useCurrentSubscriptionsContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const label = useMemo(() => buildLabel(subscriptionList.subscriptions!, name), [subscriptionList]);

  return (
    <div>
      <div className="font-bold">Subscribers</div>
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-1 mt-2">
        {subscriptionList.subscriptions!.map((s) => (
          <Avatar person={s.person!} size="tiny" key={s.person!.id} />
        ))}
        <SecondaryButton onClick={() => setIsModalOpen(true)} size="xs">
          Add/remove people...
        </SecondaryButton>
      </div>

      <EditSubscriptionsModal isModalOpen={isModalOpen} hideModal={() => setIsModalOpen(false)} />
    </div>
  );
}

function buildLabel(subscriptions: Subscription[], name: string) {
  const prefix = match(subscriptions.length)
    .with(0, () => "No one")
    .with(1, () => "1 person")
    .otherwise(() => `${subscriptions.length} people`);

  return `${prefix} will be notified when someone comments on this ${name}.`;
}
