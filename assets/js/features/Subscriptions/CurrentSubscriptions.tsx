import React, { createContext, useContext, useMemo } from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Spacer } from "@/components/Spacer";
import { Subscriber, SubscriptionList } from "@/models/notifications";
import { ExistingSubscriptionsList } from "./current-subscriptions/ExistingSubscriptionsList";
import { Subscribe } from "./current-subscriptions/Subscribe";
import { Unsubscribe } from "./current-subscriptions/Unsubscribe";
import { compareIds } from "@/routes/paths";

interface CurrentSubscriptionsProps {
  subscriptionList: SubscriptionList;
  potentialSubscribers: Subscriber[];
  name: "check-in" | "update" | "discussion" | "project retrospective" | "document" | "file";
  type:
    | "project_check_in"
    | "goal_update"
    | "message"
    | "project_retrospective"
    | "resource_hub_document"
    | "resource_hub_file";
  callback: () => void;
}

const CurrentSubscriptionsContext = createContext<CurrentSubscriptionsProps | undefined>(undefined);

export function useCurrentSubscriptionsContext() {
  const context = useContext(CurrentSubscriptionsContext);

  if (context === undefined) {
    throw Error("useCurrentSubscriptionsContext must be used within a CurrentSubscriptionsContext.Provider");
  }

  return context;
}

export function CurrentSubscriptions(props: CurrentSubscriptionsProps) {
  const me = useMe();
  const { potentialSubscribers } = props;

  const isSubscribed = useMemo(() => {
    return potentialSubscribers.find(
      (subscriber) => subscriber.isSubscribed && compareIds(subscriber.person!.id, me?.id),
    );
  }, [potentialSubscribers]);

  return (
    <div>
      <CurrentSubscriptionsContext.Provider value={props}>
        <ExistingSubscriptionsList
          // The key is necessary because, when someone subscribes/unsubscribes or is mentioned in a comment,
          // this component must reload in order to update the "initially already selected" people
          key={String(isSubscribed) + potentialSubscribers.length}
        />
        <Spacer size={2} />

        {isSubscribed ? <Unsubscribe /> : <Subscribe />}
      </CurrentSubscriptionsContext.Provider>
    </div>
  );
}
