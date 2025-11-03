import React, { useState, useEffect } from "react";
import { Avatar } from "../Avatar";
import { RadioGroup, Radio } from "./components/RadioGroup";
import { SubscribersSelectorModal } from "./components/SubscribersSelectorModal";
import { sortSubscribersByName } from "./utils";

export function SubscribersSelector({
  subscribers,
  selectedSubscribers,
  onSelectedSubscribersChange,
  subscriptionType,
  onSubscriptionTypeChange,
  alwaysNotify,
  allSubscribersLabel,
  testIdPrefix = "subscribe",
}: SubscribersSelector.Props) {
  const [showModal, setShowModal] = useState(false);

  // If all notifiable people must be notified, the widget is not displayed
  if (alwaysNotify.length >= subscribers.length) return null;

  // Automatically open modal when switching to SELECTED option
  useEffect(() => {
    if (subscriptionType === SubscribersSelector.SubscriptionOption.SELECTED) {
      setShowModal(true);
    }
  }, [subscriptionType]);

  const handleSaveSelection = (selected: SubscribersSelector.Subscriber[]) => {
    onSelectedSubscribersChange(selected);
  };

  return (
    <div>
      <p className="font-bold mb-1.5">When I post this, notify:</p>

      <RadioGroup
        name="subscriptions-options"
        onChange={(value) => onSubscriptionTypeChange(value as SubscribersSelector.SubscriptionOption)}
        defaultValue={subscriptionType}
      >
        <SubscriptionOptionItem
          label={allSubscribersLabel}
          value={SubscribersSelector.SubscriptionOption.ALL}
          subscribers={subscribers}
          isSelected={subscriptionType === SubscribersSelector.SubscriptionOption.ALL}
          testId={`${testIdPrefix}-all`}
        />

        <div onClick={() => setShowModal(true)}>
          <SubscriptionOptionItem
            label="Only the people I select"
            value={SubscribersSelector.SubscriptionOption.SELECTED}
            subscribers={selectedSubscribers}
            isSelected={subscriptionType === SubscribersSelector.SubscriptionOption.SELECTED}
            testId={`${testIdPrefix}-specific-people`}
          />
        </div>

        <SubscriptionOptionItem
          label="No one"
          value={SubscribersSelector.SubscriptionOption.NONE}
          subscribers={[]}
          isSelected={subscriptionType === SubscribersSelector.SubscriptionOption.NONE}
          testId={`${testIdPrefix}-no-one`}
        />
      </RadioGroup>

      <SubscribersSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        subscribers={subscribers}
        selectedSubscribers={selectedSubscribers}
        alwaysNotify={alwaysNotify}
        onSave={handleSaveSelection}
      />
    </div>
  );
}

interface SubscriptionOptionItemProps {
  label: string;
  value: SubscribersSelector.SubscriptionOption;
  subscribers: SubscribersSelector.Subscriber[];
  isSelected: boolean;
  testId: string;
}

function SubscriptionOptionItem({ label, value, subscribers, isSelected, testId }: SubscriptionOptionItemProps) {
  return (
    <div className="my-1">
      <Radio label={label} value={value} testId={testId} />
      <SelectedPeople subscribers={subscribers} hide={!isSelected} />
    </div>
  );
}

function SelectedPeople({ subscribers, hide }: { subscribers: SubscribersSelector.Subscriber[]; hide: boolean }) {
  if (subscribers.length === 0 || hide) return null;

  const sortedSubscribers = sortSubscribersByName(subscribers);

  return (
    <div className="flex flex-wrap gap-2 ml-6">
      {sortedSubscribers.map((subscriber) => {
        if (!subscriber.person) return null;
        return <Avatar person={subscriber.person} size="tiny" key={subscriber.person.id} />;
      })}
    </div>
  );
}

export namespace SubscribersSelector {
  export interface Person {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    title?: string | null;
  }

  export interface Subscriber {
    role?: string | null;
    priority?: boolean | null;
    isSubscribed?: boolean | null;
    person?: Person | null;
  }

  export enum SubscriptionOption {
    ALL = "all",
    SELECTED = "selected",
    NONE = "none",
  }

  export interface Props {
    subscribers: Subscriber[];
    selectedSubscribers: Subscriber[];
    onSelectedSubscribersChange: (subscribers: Subscriber[]) => void;
    subscriptionType: SubscriptionOption;
    onSubscriptionTypeChange: (type: SubscriptionOption) => void;
    alwaysNotify: Subscriber[];
    allSubscribersLabel: string;
    testIdPrefix?: string;
  }
}
