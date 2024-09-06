import React, { useMemo } from "react";

import Avatar from "@/components/Avatar";
import { useMe } from "@/contexts/CurrentUserContext";
import { Spacer } from "@/components/Spacer";
import { GhostButton } from "@/components/Buttons";
import {
  SubscriptionList,
  Subscription,
  useSubscribeToNotifications,
  useUnsubscribeFromNotifications,
} from "@/models/notifications";

type SubscriptionName = "check-in";
type SubscriptionType = "project_check_in";

interface Props {
  subscriptionList: SubscriptionList;
  name: SubscriptionName;
  type: SubscriptionType;
  callback: () => void;
}

interface SubscribeProps {
  id: string;
  type: SubscriptionType;
  callback: () => void;
}

interface UnsubscribeProps {
  id: string;
  name: SubscriptionName;
  callback: () => void;
}

export function CurrentSubscriptions({ subscriptionList, name, type, callback }: Props) {
  const me = useMe();

  const isSubscribed = useMemo(() => {
    return subscriptionList.subscriptions?.map((s) => s.person?.id).includes(me?.id);
  }, [subscriptionList.subscriptions]);

  return (
    <div>
      <CurrentSubscriptionList subscriptions={subscriptionList.subscriptions!} name={name} />
      <Spacer size={2} />

      {isSubscribed ? (
        <Unsubscribe id={subscriptionList.id!} name={name} callback={callback} />
      ) : (
        <Subscribe id={subscriptionList.id!} type={type} callback={callback} />
      )}
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
      </div>
    </div>
  );
}

function Subscribe({ id, type, callback }: SubscribeProps) {
  const [subscribe, { loading }] = useSubscribeToNotifications();

  const handleSubscribe = () => {
    subscribe({ id, type }).then(() => callback());
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

function Unsubscribe({ id, name, callback }: UnsubscribeProps) {
  const [unsubscribe, { loading }] = useUnsubscribeFromNotifications();

  const handleUnsubscribe = () => {
    unsubscribe({ id }).then(() => callback());
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
