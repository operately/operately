import React, { useState } from "react";
import { Avatar } from "../Avatar";
import { SecondaryButton } from "../Button";
import { sortSubscribersByName } from "./utils";
import { SubscribersSelectorModal } from "./components/SubscribersSelectorModal";
import { createTestId } from "../TestableElement";
import type { SubscribersSelector } from "./SubscribersSelector";

export namespace CurrentSubscriptions {
  export interface Props {
    subscribers: SubscribersSelector.Subscriber[];
    subscribedPeople: SubscribersSelector.Subscriber[];
    isCurrentUserSubscribed: boolean;
    resourceName: string;
    onSubscribe: () => void;
    onUnsubscribe: () => void;
    onEditSubscribers: (subscriberIds: string[]) => void;
    isSubscribeLoading?: boolean;
    isUnsubscribeLoading?: boolean;
  }
}

export function CurrentSubscriptions({
  subscribers,
  subscribedPeople,
  isCurrentUserSubscribed,
  resourceName,
  onSubscribe,
  onUnsubscribe,
  onEditSubscribers,
  isSubscribeLoading = false,
  isUnsubscribeLoading = false,
}: CurrentSubscriptions.Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveSubscribers = (selected: SubscribersSelector.Subscriber[]) => {
    const subscriberIds = selected.map((s) => s.person?.id).filter((id): id is string => !!id);
    onEditSubscribers(subscriberIds);
  };

  const sortedSubscribers = sortSubscribersByName(subscribedPeople);
  const label = buildLabel(subscribedPeople.length, resourceName);

  return (
    <div>
      <div className="font-bold text-sm sm:text-[16px]">Subscribers</div>
      <div className="text-xs sm:text-sm mt-1">{label}</div>
      <div className="flex items-center gap-1 mt-2 flex-wrap gap-y-2">
        {sortedSubscribers
          .filter((s) => s.person)
          .map((s, idx) => (
            <Avatar
              person={s.person!}
              size="tiny"
              key={s.person!.id}
              testId={createTestId("subscriber", s.person?.id || idx.toString())}
            />
          ))}
        <SecondaryButton onClick={() => setIsModalOpen(true)} size="xs" testId="add-remove-subscribers">
          Add/remove people...
        </SecondaryButton>
      </div>

      <div className="mt-4">
        {isCurrentUserSubscribed ? (
          <UnsubscribeSection
            resourceName={resourceName}
            onUnsubscribe={onUnsubscribe}
            isLoading={isUnsubscribeLoading}
          />
        ) : (
          <SubscribeSection onSubscribe={onSubscribe} isLoading={isSubscribeLoading} />
        )}
      </div>

      <SubscribersSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscribers={subscribers}
        selectedSubscribers={subscribedPeople}
        alwaysNotify={[]}
        onSave={handleSaveSubscribers}
      />
    </div>
  );
}

function buildLabel(count: number, resourceName: string): string {
  let prefix: string;

  if (count === 0) {
    prefix = "No one";
  } else if (count === 1) {
    prefix = "1 person";
  } else {
    prefix = `${count} people`;
  }

  return `${prefix} will be notified when someone comments on this ${resourceName}.`;
}

interface SubscribeSectionProps {
  onSubscribe: () => void;
  isLoading: boolean;
}

function SubscribeSection({ onSubscribe, isLoading }: SubscribeSectionProps) {
  return (
    <div>
      <div className="font-bold">You&apos;re not subscribed</div>
      <p className="text-sm">You won&apos;t be notified when comments are posted.</p>
      <div className="flex mt-2">
        <SecondaryButton onClick={onSubscribe} loading={isLoading} size="xs" testId="subscribe">
          Subscribe me
        </SecondaryButton>
      </div>
    </div>
  );
}

interface UnsubscribeSectionProps {
  resourceName: string;
  onUnsubscribe: () => void;
  isLoading: boolean;
}

function UnsubscribeSection({ resourceName, onUnsubscribe, isLoading }: UnsubscribeSectionProps) {
  return (
    <div>
      <div className="font-bold text-sm sm:text-[16px]">You&apos;re subscribed</div>
      <p className="text-xs sm:text-sm mt-1">
        You&apos;ll get a notification when someone comments on this {resourceName}.
      </p>
      <div className="flex mt-2">
        <SecondaryButton onClick={onUnsubscribe} loading={isLoading} size="xs" testId="unsubscribe">
          Unsubscribe me
        </SecondaryButton>
      </div>
    </div>
  );
}
