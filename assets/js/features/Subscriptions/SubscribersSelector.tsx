import React, { useState, useMemo, createContext } from "react";

import { Project } from "@/models/projects";
import { RadioGroup } from "@/components/Form";
import { SubscriptionOption } from "./SubscriptionOption";
import { SubscribersSelectorModal } from "./SubscribersSelectorModal";
import { SubscriptionsState, Options } from ".";

export const SubscriptionsContext = createContext<SubscriptionsState | undefined>(undefined);

export function SubscribersSelector({ state, project }: { state: SubscriptionsState; project: Project }) {
  const [showSelector, setShowSelector] = useState(false);
  const { people, selectedPeople, subscriptionType, setSubscriptionType } = state;

  const selectedPeopleLabel = useMemo(() => {
    switch (selectedPeople.length) {
      case 0:
        return "Only the people I select";
      case 1:
        return "Only the following person I selected";
      default:
        return `Only the following ${selectedPeople.length} people I selected`;
    }
  }, [selectedPeople]);

  return (
    <SubscriptionsContext.Provider value={state}>
      <div>
        <p className="text-lg font-bold mb-2">When I post this, notify:</p>

        <RadioGroup name="subscriptions-options" onChange={setSubscriptionType} defaultValue={subscriptionType}>
          <SubscriptionOption
            label={
              (people.length > 1 ? `All ${people.length} people` : "The 1 person") + ` contributing to ${project.name}`
            }
            value={Options.ALL}
            people={people}
          />

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
