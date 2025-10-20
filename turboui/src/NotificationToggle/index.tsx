import React from "react";
import { IconBell, IconBellOff } from "../icons";
import { SecondaryButton } from "../Button";

export namespace NotificationToggle {
  export interface Props {
    isSubscribed: boolean;
    onToggle: (subscribed: boolean) => void;
    entityType: "task" | "project" | "milestone";
  }
}

export function NotificationToggle({
  isSubscribed,
  onToggle,
  entityType,
}: NotificationToggle.Props) {
  const handleToggle = () => {
    onToggle(!isSubscribed);
  };

  const subscribedMessage = `You're receiving notifications because you're subscribed to this ${entityType}.`;
  const unsubscribedMessage = `You're not receiving notifications from this ${entityType}.`;

  const testId = isSubscribed ? "project-unsubscribe-button" : "project-subscribe-button"

  return (
    <div className="space-y-2">
      <SecondaryButton size="xs" onClick={handleToggle} icon={isSubscribed ? IconBellOff : IconBell} testId={testId}>
        {isSubscribed ? "Unsubscribe" : "Subscribe"}
      </SecondaryButton>

      <div className="text-xs text-content-dimmed">
        {isSubscribed ? subscribedMessage : unsubscribedMessage}
      </div>
    </div>
  );
}