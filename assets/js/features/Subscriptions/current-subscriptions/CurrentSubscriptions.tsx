import React, { useMemo } from "react";

import { useMe } from "@/contexts/CurrentUserContext";
import { Spacer } from "@/components/Spacer";
import { GhostButton } from "@/components/Button";
import { SubscriptionList, useSubscribeToNotifications, useUnsubscribeFromNotifications } from "@/models/notifications";
import { NotifiablePerson } from "@/features/Subscriptions";
import { CurrentSubscriptionsContext, useCurrentSubscriptionsContext } from "./CurrentSubscriptionsContext";
import { ExistingSubscriptionsList } from "./ExistingSubscriptionsList";

export interface CurrentSubscriptionsProps {
  subscriptionList: SubscriptionList;
  name: "check-in";
  type: "project_check_in";
  callback: () => void;
  people: NotifiablePerson[];
  projectName?: string;
}

export function CurrentSubscriptions(props: CurrentSubscriptionsProps) {
  const me = useMe();

  const isSubscribed = useMemo(() => {
    return props.subscriptionList.subscriptions?.map((s) => s.person?.id).includes(me?.id);
  }, [props.subscriptionList.subscriptions]);

  return (
    <div>
      <CurrentSubscriptionsContext.Provider value={props}>
        <ExistingSubscriptionsList />
        <Spacer size={2} />

        {isSubscribed ? <Unsubscribe /> : <Subscribe />}
      </CurrentSubscriptionsContext.Provider>
    </div>
  );
}

function Subscribe() {
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

function Unsubscribe() {
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
