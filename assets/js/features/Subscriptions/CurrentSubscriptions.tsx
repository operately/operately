import React, { useMemo } from "react";

import Avatar from "@/components/Avatar";
import { useMe } from "@/contexts/CurrentUserContext";
import { Spacer } from "@/components/Spacer";
import { GhostButton } from "@/components/Button";
import { SubscriptionList, Subscription } from "@/models/notifications";

interface Props {
  subscriptionList: SubscriptionList;
  name: "check-in";
}

export function CurrentSubscriptions({ subscriptionList, name }: Props) {
  const me = useMe();

  const isSubscribed = useMemo(() => {
    return subscriptionList.subscriptions?.map((s) => s.person?.id).includes(me?.id);
  }, [subscriptionList.subscriptions]);

  return (
    <div>
      <CurrentSubscriptionList subscriptions={subscriptionList.subscriptions!} name={name} />
      <Spacer size={2} />

      {isSubscribed ? <Unsubscribe name={name} /> : <Subscribe />}
    </div>
  );
}

function CurrentSubscriptionList({ subscriptions, name }: { subscriptions: Subscription[]; name: string }) {
  let message: string;

  switch (subscriptions.length) {
    case 0:
      message = "No one";
      break;
    case 1:
      message = "1 person";
      break;
    default:
      message = `${subscriptions.length} people`;
  }

  return (
    <div>
      <div className="font-bold">Subscribers</div>
      <p className="text-sm">
        {message} will be notified when someone comments on this {name}.
      </p>
      <div className="flex items-center gap-1 mt-2">
        {subscriptions.map((s) => (
          <Avatar person={s.person!} size="tiny" key={s.person!.id} />
        ))}
        <GhostButton size="xs" type="secondary">
          Add/remove people...
        </GhostButton>
      </div>
    </div>
  );
}

function Subscribe() {
  return (
    <div>
      <div className="font-bold">You&apos;re not subscribed</div>
      <p className="text-sm">You won&apos;t be notified when comments are posted.</p>
      <div className="flex mt-2">
        <GhostButton size="xs" type="secondary">
          Subscribe me
        </GhostButton>
      </div>
    </div>
  );
}

function Unsubscribe({ name }) {
  return (
    <div>
      <div className="font-bold">You&apos;re subscribed</div>
      <p className="text-sm">You&apos;ll get a notification when someone comments on this {name}.</p>
      <div className="flex mt-2">
        <GhostButton size="xs" type="secondary">
          Unsubscribe me
        </GhostButton>
      </div>
    </div>
  );
}
