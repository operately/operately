import React, { useMemo, useState } from "react";

import { match } from "ts-pattern";
import Avatar from "@/components/Avatar";
import { Subscriber } from "@/models/notifications";
import { EditSubscriptionsModal } from "./EditSubscriptionsModal";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";
import { SecondaryButton } from "@/components/Buttons";

export function ExistingSubscriptionsList() {
  const { potentialSubscribers, name } = useCurrentSubscriptionsContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const subscribers = useMemo(() => potentialSubscribers.filter((sub) => sub.isSubscribed), [potentialSubscribers]);
  const label = useMemo(() => buildLabel(subscribers, name), [subscribers]);

  return (
    <div>
      <div className="font-bold">Subscribers</div>
      <div className="text-sm">{label}</div>
      <div className="flex items-center gap-1 mt-2 flex-wrap gap-y-2">
        {subscribers.map((s) => (
          <Avatar person={s.person!} size="tiny" key={s.person!.id} />
        ))}
        <SecondaryButton onClick={() => setIsModalOpen(true)} size="xs" testId="add-remove-subscribers">
          Add/remove people...
        </SecondaryButton>
      </div>

      <EditSubscriptionsModal isModalOpen={isModalOpen} hideModal={() => setIsModalOpen(false)} />
    </div>
  );
}

function buildLabel(subscribers: Subscriber[], name: string) {
  const prefix = match(subscribers.length)
    .with(0, () => "No one")
    .with(1, () => "1 person")
    .otherwise(() => `${subscribers.length} people`);

  return `${prefix} will be notified when someone comments on this ${name}.`;
}
