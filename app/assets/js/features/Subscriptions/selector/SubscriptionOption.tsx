import React from "react";

import Avatar from "@/components/Avatar";
import { Radio } from "@/components/Form";
import { Subscriber } from "@/models/notifications";
import { Options } from "@/features/Subscriptions";
import { useSubscribersSelectorContext } from "../SubscribersSelectorContext";

interface SubscriptionOptionProps {
  label: string;
  value: Options;
  subscribers: Subscriber[];
  testId: string;
  onClick?: () => void;
}

export function SubscriptionOption({ label, value, subscribers, testId, onClick }: SubscriptionOptionProps) {
  const { subscriptionType } = useSubscribersSelectorContext();

  return (
    <div className="my-1" onClick={onClick}>
      <Radio label={label} value={value} testId={testId} />
      <SelectedPeople subscribers={subscribers} hide={subscriptionType !== value} />
    </div>
  );
}

function SelectedPeople({ subscribers, hide }: { subscribers: Subscriber[]; hide: boolean }) {
  if (subscribers.length === 0 || hide) return <></>;

  return (
    <div className="flex flex-wrap gap-2 ml-6">
      {subscribers.map((subscriber) => (
        <Avatar person={subscriber.person!} size="tiny" key={subscriber.person!.id} />
      ))}
    </div>
  );
}
