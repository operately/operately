import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SubscribersSelector } from "./SubscribersSelector";
import { CurrentSubscriptions } from "./CurrentSubscriptions";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Components/Subscriptions",
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl bg-surface-base p-8 rounded-lg shadow-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;

// Mock data
const mockPeople = genPeople(6);

const mockSubscribers: SubscribersSelector.Subscriber[] = mockPeople.map((person) => ({
  person,
  isSubscribed: false,
  priority: false,
  role: null,
}));

const mockSubscribedPeople: SubscribersSelector.Subscriber[] = [
  { person: mockPeople[0], isSubscribed: true, priority: false, role: null },
  { person: mockPeople[1], isSubscribed: true, priority: false, role: null },
  { person: mockPeople[2], isSubscribed: true, priority: false, role: null },
];

const mockPrioritySubscribers: SubscribersSelector.Subscriber[] = [
  { person: mockPeople[0], isSubscribed: true, priority: true, role: "owner" },
];

// SubscribersSelector Stories
type SubscribersSelectorStory = StoryObj<typeof SubscribersSelector>;

export const SubscribersSelectorDefault: SubscribersSelectorStory = {
  render: () => {
    const [subscriptionType, setSubscriptionType] = useState<SubscribersSelector.SubscriptionOption>(SubscribersSelector.SubscriptionOption.ALL);
    const [selectedSubscribers, setSelectedSubscribers] = useState<SubscribersSelector.Subscriber[]>([]);

    return (
      <SubscribersSelector
          subscribers={mockSubscribers}
          selectedSubscribers={selectedSubscribers}
          onSelectedSubscribersChange={(subs) => {
            console.log("Selected subscribers changed:", subs);
            setSelectedSubscribers(subs);
          }}
          subscriptionType={subscriptionType}
          onSubscriptionTypeChange={(type) => {
            console.log("Subscription type changed:", type);
            setSubscriptionType(type);
          }}
          alwaysNotify={[]}
          allSubscribersLabel="All 6 people who have access to this resource"
        />
    );
  },
};

export const SubscribersSelectorWithPrioritySubscribers: SubscribersSelectorStory = {
  render: () => {
    const [subscriptionType, setSubscriptionType] = useState<SubscribersSelector.SubscriptionOption>(SubscribersSelector.SubscriptionOption.ALL);
    const [selectedSubscribers, setSelectedSubscribers] = useState<SubscribersSelector.Subscriber[]>(mockPrioritySubscribers);

    return (
      <SubscribersSelector
          subscribers={mockSubscribers}
          selectedSubscribers={selectedSubscribers}
          onSelectedSubscribersChange={(subs) => {
            console.log("Selected subscribers changed:", subs);
            setSelectedSubscribers(subs);
          }}
          subscriptionType={subscriptionType}
          onSubscriptionTypeChange={(type) => {
            console.log("Subscription type changed:", type);
            setSubscriptionType(type);
          }}
          alwaysNotify={mockPrioritySubscribers}
          allSubscribersLabel="All 6 people contributing to Project Alpha"
        />
    );
  },
};

export const SubscribersSelectorSelectedPeople: SubscribersSelectorStory = {
  render: () => {
    const [subscriptionType, setSubscriptionType] = useState<SubscribersSelector.SubscriptionOption>(SubscribersSelector.SubscriptionOption.SELECTED);
    const initialSelected = [mockSubscribers[0], mockSubscribers[2], mockSubscribers[4]].filter(
      (s): s is SubscribersSelector.Subscriber => s !== undefined,
    );
    const [selectedSubscribers, setSelectedSubscribers] = useState<SubscribersSelector.Subscriber[]>(initialSelected);

    return (
      <SubscribersSelector
          subscribers={mockSubscribers}
          selectedSubscribers={selectedSubscribers}
          onSelectedSubscribersChange={(subs) => {
            console.log("Selected subscribers changed:", subs);
            setSelectedSubscribers(subs);
          }}
          subscriptionType={subscriptionType}
          onSubscriptionTypeChange={(type) => {
            console.log("Subscription type changed:", type);
            setSubscriptionType(type);
          }}
          alwaysNotify={[]}
          allSubscribersLabel="All 6 people who are members of the Engineering space"
        />
    );
  },
};

export const SubscribersSelectorNone: SubscribersSelectorStory = {
  render: () => {
    const [subscriptionType, setSubscriptionType] = useState<SubscribersSelector.SubscriptionOption>(SubscribersSelector.SubscriptionOption.NONE);
    const [selectedSubscribers, setSelectedSubscribers] = useState<SubscribersSelector.Subscriber[]>([]);

    return (
      <SubscribersSelector
          subscribers={mockSubscribers}
          selectedSubscribers={selectedSubscribers}
          onSelectedSubscribersChange={(subs) => {
            console.log("Selected subscribers changed:", subs);
            setSelectedSubscribers(subs);
          }}
          subscriptionType={subscriptionType}
          onSubscriptionTypeChange={(type) => {
            console.log("Subscription type changed:", type);
            setSubscriptionType(type);
          }}
          alwaysNotify={[]}
          allSubscribersLabel="All 6 people who have access"
        />
    );
  },
};

// CurrentSubscriptions Stories
type CurrentSubscriptionsStory = StoryObj<typeof CurrentSubscriptions>;

export const CurrentSubscriptionsSubscribed: CurrentSubscriptionsStory = {
  render: () => {
    const [subscribedPeople, setSubscribedPeople] = useState<SubscribersSelector.Subscriber[]>(mockSubscribedPeople);
    const [isSubscribed, setIsSubscribed] = useState(true);

    return (
      <CurrentSubscriptions
          subscribers={mockSubscribers}
          subscribedPeople={subscribedPeople}
          isCurrentUserSubscribed={isSubscribed}
          resourceName="document"
          onSubscribe={() => {
            console.log("Subscribe clicked");
            setIsSubscribed(true);
          }}
          onUnsubscribe={() => {
            console.log("Unsubscribe clicked");
            setIsSubscribed(false);
          }}
          onEditSubscribers={(ids) => {
            console.log("Edit subscribers:", ids);
            const updated = mockSubscribers.filter((s) => ids.includes(s.person?.id || ""));
            setSubscribedPeople(updated);
          }}
        />
    );
  },
};

export const CurrentSubscriptionsNotSubscribed: CurrentSubscriptionsStory = {
  render: () => {
    const [subscribedPeople, setSubscribedPeople] = useState<SubscribersSelector.Subscriber[]>(mockSubscribedPeople);
    const [isSubscribed, setIsSubscribed] = useState(false);

    return (
      <CurrentSubscriptions
          subscribers={mockSubscribers}
          subscribedPeople={subscribedPeople}
          isCurrentUserSubscribed={isSubscribed}
          resourceName="check-in"
          onSubscribe={() => {
            console.log("Subscribe clicked");
            setIsSubscribed(true);
          }}
          onUnsubscribe={() => {
            console.log("Unsubscribe clicked");
            setIsSubscribed(false);
          }}
          onEditSubscribers={(ids) => {
            console.log("Edit subscribers:", ids);
            const updated = mockSubscribers.filter((s) => ids.includes(s.person?.id || ""));
            setSubscribedPeople(updated);
          }}
        />
    );
  },
};

export const CurrentSubscriptionsNoSubscribers: CurrentSubscriptionsStory = {
  render: () => {
    const [subscribedPeople, setSubscribedPeople] = useState<SubscribersSelector.Subscriber[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);

    return (
      <CurrentSubscriptions
          subscribers={mockSubscribers}
          subscribedPeople={subscribedPeople}
          isCurrentUserSubscribed={isSubscribed}
          resourceName="discussion"
          onSubscribe={() => {
            console.log("Subscribe clicked");
            setIsSubscribed(true);
          }}
          onUnsubscribe={() => {
            console.log("Unsubscribe clicked");
            setIsSubscribed(false);
          }}
          onEditSubscribers={(ids) => {
            console.log("Edit subscribers:", ids);
            const updated = mockSubscribers.filter((s) => ids.includes(s.person?.id || ""));
            setSubscribedPeople(updated);
          }}
        />
    );
  },
};

export const CurrentSubscriptionsLoading: CurrentSubscriptionsStory = {
  render: () => {
    return (
      <CurrentSubscriptions
          subscribers={mockSubscribers}
          subscribedPeople={mockSubscribedPeople}
          isCurrentUserSubscribed={false}
          resourceName="update"
          onSubscribe={() => console.log("Subscribe clicked")}
          onUnsubscribe={() => console.log("Unsubscribe clicked")}
          onEditSubscribers={(ids) => console.log("Edit subscribers:", ids)}
          isSubscribeLoading={true}
        />
    );
  },
};
