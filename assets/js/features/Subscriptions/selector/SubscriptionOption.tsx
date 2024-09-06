import React from "react";

import Avatar from "@/components/Avatar";
import { Radio } from "@/components/Form";
import { Person } from "@/models/people";
import { Options } from "@/features/Subscriptions";
import { useSubscribersSelectorContext } from "../SubscribersSelectorContext";

interface SubscriptionOptionProps {
  label: string;
  value: Options;
  people: Person[];
  onClick?: () => void;
}

export function SubscriptionOption({ label, value, people, onClick }: SubscriptionOptionProps) {
  const { subscriptionType } = useSubscribersSelectorContext();

  return (
    <div className="my-1" onClick={onClick}>
      <Radio label={label} value={value} />
      <SelectedPeople people={people} hide={subscriptionType !== value} />
    </div>
  );
}

function SelectedPeople({ people, hide }) {
  if (people.length === 0 || hide) return <></>;

  return (
    <div className="flex flex-wrap gap-2 ml-6">
      {people.map((person) => (
        <Avatar person={person} size="tiny" key={person.id} />
      ))}
    </div>
  );
}
