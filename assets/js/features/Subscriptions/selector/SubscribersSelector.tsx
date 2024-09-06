import React, { useState, useMemo, createContext } from "react";

import { RadioGroup } from "@/components/Form";
import { SubscriptionsState, Options } from "@/features/Subscriptions";
import { findAllPeopleLabel, findSelectedPeopleLabel } from "@/features/Subscriptions/utils";
import { SubscriptionOption } from "./SubscriptionOption";
import { SubscribersSelectorModal } from "./SubscribersSelectorModal";

interface Props {
  state: SubscriptionsState;
  projectName?: string;
}

export const SubscriptionsContext = createContext<SubscriptionsState | undefined>(undefined);

export function SubscribersSelector({ state, projectName }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const { people, selectedPeople, subscriptionType, setSubscriptionType, alwaysNotify } = state;

  const selectedPeopleLabel = useMemo(() => findSelectedPeopleLabel(selectedPeople), [selectedPeople]);
  const allPeopleLabel = useMemo(() => findAllPeopleLabel(people, { projectName }), []);

  // If all notifiable people must be notified,
  // the widget is not displayed.
  if (alwaysNotify.length >= people.length) return <></>;

  return (
    <SubscriptionsContext.Provider value={state}>
      <div>
        <p className="text-lg font-bold mb-2">When I post this, notify:</p>

        <RadioGroup name="subscriptions-options" onChange={setSubscriptionType} defaultValue={subscriptionType}>
          <SubscriptionOption label={allPeopleLabel} value={Options.ALL} people={people} />

          <SubscriptionOption
            label={selectedPeopleLabel}
            value={Options.SELECTED}
            people={selectedPeople}
            onClick={() => setShowSelector(true)}
          />

          <SubscriptionOption label="No one" value={Options.NONE} people={[]} />
        </RadioGroup>

        <SubscribersSelectorModal showSelector={showSelector} setShowSelector={setShowSelector} />
      </div>
    </SubscriptionsContext.Provider>
  );
}
