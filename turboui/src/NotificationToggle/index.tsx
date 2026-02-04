import React from "react";
import { IconBell, IconBellOff } from "../icons";
import { SecondaryButton } from "../Button";

const ENTITY_LABEL_BY_TYPE: Record<NotificationToggle.Props["entityType"], string> = {
  project_task: "task",
  space_task: "task",
  project: "project",
  milestone: "milestone",
};

export namespace NotificationToggle {
  export interface Props {
    isSubscribed: boolean;
    onToggle: (subscribed: boolean) => void;
    entityType: "project_task" | "space_task" | "project" | "milestone";
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

  const entityLabel = ENTITY_LABEL_BY_TYPE[entityType] ?? entityType.replace(/_/g, " ");

  const subscribedMessage = `You're receiving notifications because you're subscribed to this ${entityLabel}.`;
  const unsubscribedMessage = `You're not receiving notifications from this ${entityLabel}.`;

  const testId = isSubscribed ? "project-unsubscribe-button" : "project-subscribe-button";

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
