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
    // Optional override for the notification sentence shown in the subscribers
    // section and subscribe/unsubscribe copy. When omitted, defaults to comment
    // wording for backwards compatibility with existing screens.
    notifyWhen?: string;
    onSubscribe: () => void;
    onUnsubscribe: () => void;
    onEditSubscribers: (subscriberIds: string[]) => void;
    isSubscribeLoading?: boolean;
    isUnsubscribeLoading?: boolean;
    canEditSubscribers: boolean;
  }
}

export function CurrentSubscriptions({
  subscribers,
  subscribedPeople,
  isCurrentUserSubscribed,
  resourceName,
  notifyWhen,
  onSubscribe,
  onUnsubscribe,
  onEditSubscribers,
  isSubscribeLoading = false,
  isUnsubscribeLoading = false,
  canEditSubscribers,
}: CurrentSubscriptions.Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveSubscribers = (selected: SubscribersSelector.Subscriber[]) => {
    const subscriberIds = selected.map((s) => s.person?.id).filter((id): id is string => !!id);
    onEditSubscribers(subscriberIds);
  };

  const sortedSubscribers = sortSubscribersByName(subscribedPeople);
  const label = buildLabel(subscribedPeople.length, resourceName, notifyWhen);

  return (
    <div>
      <CurrentSubscribersSection
        label={label}
        sortedSubscribers={sortedSubscribers}
        canEditSubscribers={canEditSubscribers}
        setIsModalOpen={setIsModalOpen}
      />

      <div className="mt-4">
        {isCurrentUserSubscribed ? (
          <UnsubscribeSection
            resourceName={resourceName}
            notifyWhen={notifyWhen}
            onUnsubscribe={onUnsubscribe}
            isLoading={isUnsubscribeLoading}
          />
        ) : (
          <SubscribeSection notifyWhen={notifyWhen} onSubscribe={onSubscribe} isLoading={isSubscribeLoading} />
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

interface CurrentSubscribersSectionProps {
  label: string;
  sortedSubscribers: SubscribersSelector.Subscriber[];
  canEditSubscribers: boolean;
  setIsModalOpen: (open: boolean) => void;
}

function CurrentSubscribersSection({
  label,
  sortedSubscribers,
  canEditSubscribers,
  setIsModalOpen,
}: CurrentSubscribersSectionProps) {
  const noSubscribers = !sortedSubscribers || sortedSubscribers.length < 1;

  if (noSubscribers && !canEditSubscribers) {
    return null;
  }

  return (
    <>
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
        {canEditSubscribers && (
          <SecondaryButton onClick={() => setIsModalOpen(true)} size="xs" testId="add-remove-subscribers">
            Add/remove people...
          </SecondaryButton>
        )}
      </div>
    </>
  );
}

function buildLabel(count: number, resourceName: string, notifyWhen?: string): string {
  let prefix: string;

  if (count === 0) {
    prefix = "No one";
  } else if (count === 1) {
    prefix = "1 person";
  } else {
    prefix = `${count} people`;
  }

  if (notifyWhen) {
    return `${prefix} will be notified when ${notifyWhen}.`;
  }

  return `${prefix} will be notified when someone comments on this ${resourceName}.`;
}

interface SubscribeSectionProps {
  onSubscribe: () => void;
  isLoading: boolean;
  notifyWhen?: string;
}

function SubscribeSection({ onSubscribe, isLoading, notifyWhen }: SubscribeSectionProps) {
  return (
    <div>
      <div className="font-bold">You&apos;re not subscribed</div>
      <p className="text-sm">
        {notifyWhen ? `You won't be notified when ${notifyWhen}.` : "You won't be notified when comments are posted."}
      </p>
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
  notifyWhen?: string;
}

function UnsubscribeSection({ resourceName, onUnsubscribe, isLoading, notifyWhen }: UnsubscribeSectionProps) {
  return (
    <div>
      <div className="font-bold text-sm sm:text-[16px]">You&apos;re subscribed</div>
      <p className="text-xs sm:text-sm mt-1">
        {notifyWhen
          ? `You'll get a notification when ${notifyWhen}.`
          : `You'll get a notification when someone comments on this ${resourceName}.`}
      </p>
      <div className="flex mt-2">
        <SecondaryButton onClick={onUnsubscribe} loading={isLoading} size="xs" testId="unsubscribe">
          Unsubscribe me
        </SecondaryButton>
      </div>
    </div>
  );
}
