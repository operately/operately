import React from "react";
import { useTranslation } from "react-i18next";
import { IconBell, IconBellOff } from "../icons";
import { SecondaryButton } from "../Button";

export namespace NotificationToggle {
  export interface Props {
    isSubscribed: boolean;
    onToggle: (subscribed: boolean) => void;
    entityType: "project_task" | "space_task" | "project" | "milestone" | "kpi";
  }
}

export function NotificationToggle({ isSubscribed, onToggle, entityType }: NotificationToggle.Props) {
  const { t } = useTranslation();

  const handleToggle = () => {
    onToggle(!isSubscribed);
  };

  const messages = {
    project_task: {
      subscribed: t("You're receiving notifications because you're subscribed to this task."),
      unsubscribed: t("You're not receiving notifications from this task."),
    },
    space_task: {
      subscribed: t("You're receiving notifications because you're subscribed to this task."),
      unsubscribed: t("You're not receiving notifications from this task."),
    },
    project: {
      subscribed: t("You're receiving notifications because you're subscribed to this project."),
      unsubscribed: t("You're not receiving notifications from this project."),
    },
    milestone: {
      subscribed: t("You're receiving notifications because you're subscribed to this milestone."),
      unsubscribed: t("You're not receiving notifications from this milestone."),
    },
    kpi: {
      subscribed: t("You're receiving notifications because you're subscribed to this KPI."),
      unsubscribed: t("You're not receiving notifications from this KPI."),
    },
  }[entityType];

  const testId = isSubscribed ? "project-unsubscribe-button" : "project-subscribe-button";

  return (
    <div className="space-y-2">
      <SecondaryButton size="xs" onClick={handleToggle} icon={isSubscribed ? IconBellOff : IconBell} testId={testId}>
        {isSubscribed ? t("Unsubscribe") : t("Subscribe")}
      </SecondaryButton>

      <div className="text-xs text-content-dimmed">{isSubscribed ? messages.subscribed : messages.unsubscribed}</div>
    </div>
  );
}
