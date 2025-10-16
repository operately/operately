import React, { useMemo, useState } from "react";

import { match } from "ts-pattern";
import { Avatar } from "turboui";
import { Subscriber } from "@/models/notifications";
import { EditSubscriptionsModal } from "./EditSubscriptionsModal";
import { useCurrentSubscriptionsContext } from "../CurrentSubscriptions";
import { SecondaryButton } from "turboui";
import { sortSubscribersByName } from "@/features/Subscriptions";
import { createTestId } from "@/utils/testid";

export function ExistingSubscriptionsList() {
  const { potentialSubscribers, name } = useCurrentSubscriptionsContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const subscribers = useMemo(() => {
    const filtered = potentialSubscribers.filter((sub) => sub.isSubscribed);
    return sortSubscribersByName(filtered);
  }, [potentialSubscribers]);
  const label = useMemo(() => buildLabel(subscribers, name), [subscribers]);

  return (
    <div>
      <div className="font-bold text-sm sm:text-[16px]">Subscribers</div>
      <div className="text-xs sm:text-sm mt-1">{label}</div>
      <div className="flex items-center gap-1 mt-2 flex-wrap gap-y-2">
        {subscribers.filter((s) => s.person).map((s) => (
          <Avatar person={s.person!} size="tiny" key={s.person!.id} testId={createTestId("subscriber", s.person!.id)}  />
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
