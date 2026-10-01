import { Trans } from "../Translate";
import i18n, { tn } from "../i18n";
import { useTranslation } from "react-i18next";
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
    canEditSubscribers: boolean;
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
  canEditSubscribers,
}: CurrentSubscriptions.Props) {
  useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveSubscribers = (selected: SubscribersSelector.Subscriber[]) => {
    const subscriberIds = selected.map((s) => s.person?.id).filter((id): id is string => !!id);
    onEditSubscribers(subscriberIds);
  };

  const sortedSubscribers = sortSubscribersByName(subscribedPeople);
  const label = buildLabel(subscribedPeople.length, resourceName);

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
  const { t } = useTranslation();
  const noSubscribers = !sortedSubscribers || sortedSubscribers.length < 1;

  if (noSubscribers && !canEditSubscribers) {
    return null;
  }

  return (
    <>
      <div className="font-bold text-sm sm:text-[16px]">{t("Subscribers")}</div>
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
            {t("Add/remove people...")}
          </SecondaryButton>
        )}
      </div>
    </>
  );
}

function buildLabel(count: number, resourceName: string): string {
  switch (resourceName) {
    case "check-in":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this check-in.");
      return tn(
        "1 person will be notified when someone comments on this check-in.",
        "{{count}} people will be notified when someone comments on this check-in.",
        count,
      );
    case "discussion":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this discussion.");
      return tn(
        "1 person will be notified when someone comments on this discussion.",
        "{{count}} people will be notified when someone comments on this discussion.",
        count,
      );
    case "project retrospective":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this project retrospective.");
      return tn(
        "1 person will be notified when someone comments on this project retrospective.",
        "{{count}} people will be notified when someone comments on this project retrospective.",
        count,
      );
    case "document":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this document.");
      return tn(
        "1 person will be notified when someone comments on this document.",
        "{{count}} people will be notified when someone comments on this document.",
        count,
      );
    case "file":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this file.");
      return tn(
        "1 person will be notified when someone comments on this file.",
        "{{count}} people will be notified when someone comments on this file.",
        count,
      );
    case "link":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this link.");
      return tn(
        "1 person will be notified when someone comments on this link.",
        "{{count}} people will be notified when someone comments on this link.",
        count,
      );
    case "task":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this task.");
      return tn(
        "1 person will be notified when someone comments on this task.",
        "{{count}} people will be notified when someone comments on this task.",
        count,
      );
    case "milestone":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this milestone.");
      return tn(
        "1 person will be notified when someone comments on this milestone.",
        "{{count}} people will be notified when someone comments on this milestone.",
        count,
      );
    case "project":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this project.");
      return tn(
        "1 person will be notified when someone comments on this project.",
        "{{count}} people will be notified when someone comments on this project.",
        count,
      );
    case "goal":
      if (count === 0) return i18n.t("No one will be notified when someone comments on this goal.");
      return tn(
        "1 person will be notified when someone comments on this goal.",
        "{{count}} people will be notified when someone comments on this goal.",
        count,
      );
    default:
      if (count === 0)
        return i18n.t("No one will be notified when someone comments on this {{resourceName}}.", { resourceName });
      return tn(
        "1 person will be notified when someone comments on this {{resourceName}}.",
        "{{count}} people will be notified when someone comments on this {{resourceName}}.",
        count,
        { resourceName },
      );
  }
}

function subscriptionDescription(resourceName: string) {
  switch (resourceName) {
    case "check-in":
      return i18n.t("You'll get a notification when someone comments on this check-in.");
    case "discussion":
      return i18n.t("You'll get a notification when someone comments on this discussion.");
    case "project retrospective":
      return i18n.t("You'll get a notification when someone comments on this project retrospective.");
    case "document":
      return i18n.t("You'll get a notification when someone comments on this document.");
    case "file":
      return i18n.t("You'll get a notification when someone comments on this file.");
    case "link":
      return i18n.t("You'll get a notification when someone comments on this link.");
    case "task":
      return i18n.t("You'll get a notification when someone comments on this task.");
    case "milestone":
      return i18n.t("You'll get a notification when someone comments on this milestone.");
    case "project":
      return i18n.t("You'll get a notification when someone comments on this project.");
    case "goal":
      return i18n.t("You'll get a notification when someone comments on this goal.");
    default:
      return i18n.t("You'll get a notification when someone comments on this {{resourceName}}.", { resourceName });
  }
}

interface SubscribeSectionProps {
  onSubscribe: () => void;
  isLoading: boolean;
}

function SubscribeSection({ onSubscribe, isLoading }: SubscribeSectionProps) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="font-bold">
        <Trans i18nKey="You're not subscribed" />
      </div>
      <p className="text-sm">
        <Trans i18nKey="You won't be notified when comments are posted." />
      </p>
      <div className="flex mt-2">
        <SecondaryButton onClick={onSubscribe} loading={isLoading} size="xs" testId="subscribe">
          {t("Subscribe me")}
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
  const { t } = useTranslation();
  return (
    <div>
      <div className="font-bold text-sm sm:text-[16px]">
        <Trans i18nKey="You're subscribed" />
      </div>
      <p className="text-xs sm:text-sm mt-1">{subscriptionDescription(resourceName)}</p>
      <div className="flex mt-2">
        <SecondaryButton onClick={onUnsubscribe} loading={isLoading} size="xs" testId="unsubscribe">
          {t("Unsubscribe me")}
        </SecondaryButton>
      </div>
    </div>
  );
}
