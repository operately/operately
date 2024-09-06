import React, { useState, useMemo } from "react";

import { RadioGroup } from "@/components/Form";
import { SubscriptionsState, Options, NotifiablePerson } from "@/features/Subscriptions";
import { SubscriptionOption } from "./selector/SubscriptionOption";
import { SubscribersSelectorModal } from "./selector/SubscribersSelectorModal";
import { SubscribersSelectorProvider } from "./SubscribersSelectorContext";

interface Props {
  state: SubscriptionsState;
  projectName?: string;
}

export function SubscribersSelector({ state, projectName }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const { people, selectedPeople, subscriptionType, setSubscriptionType, alwaysNotify } = state;

  const selectedPeopleLabel = useMemo(() => buildSelectedPeopleLabel(selectedPeople), [selectedPeople]);
  const allPeopleLabel = useMemo(() => buildAllPeopleLabel(people, { projectName }), []);

  // If all notifiable people must be notified,
  // the widget is not displayed.
  if (alwaysNotify.length >= people.length) return <></>;

  return (
    <SubscribersSelectorProvider state={state}>
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
    </SubscribersSelectorProvider>
  );
}

interface BuildAllPeopleLabelOpts {
  projectName?: string;
}

function buildAllPeopleLabel(people: NotifiablePerson[], opts: BuildAllPeopleLabelOpts) {
  const part1 = people.length > 1 ? `All ${people.length} people` : "The 1 person";
  let part2 = "";

  if (opts.projectName) {
    part2 = ` contributing to ${opts.projectName}`;
  }

  return part1 + part2;
}

function buildSelectedPeopleLabel(selectedPeople: NotifiablePerson[]) {
  switch (selectedPeople.length) {
    case 0:
      return "Only the people I select";
    case 1:
      return "Only the following person I selected";
    default:
      return `Only the following ${selectedPeople.length} people I selected`;
  }
}
