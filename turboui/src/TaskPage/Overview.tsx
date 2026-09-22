import React from "react";
import { useTranslation } from "react-i18next";
import { translationText } from "../i18n";
import { TaskPage } from "./types";
import { variantFeatures } from "./variantFeatures";
import { Timeline } from "../Timeline";
import { PageDescription } from "../PageDescription";

export function Overview(props: TaskPage.ContentState) {
  const { t } = useTranslation();

  return (
    <div className="space-y-12 sm:col-span-8 sm:pr-8">
      <PageDescription
        {...props}
        label={translationText(t("Notes"))}
        placeholder={translationText(t("Describe the task..."))}
        zeroStatePlaceholder={translationText(t("Add notes about this task..."))}
        localDraftKey={props.localDraftKeyBase ? `${props.localDraftKeyBase}:description` : undefined}
      />
      <ActivitySection {...props} />
    </div>
  );
}

function ActivitySection(props: TaskPage.ContentState) {
  const { t } = useTranslation();

  if (!variantFeatures(props.variant).showActivity) return null;

  if (props.timelineItems && props.currentUser) {
    return (
      <div data-test-id="task-activity-section">
        <h3 className="font-bold mb-4">{t("Comments & Activity")}</h3>
        <Timeline
          items={props.timelineItems}
          currentUser={props.currentUser}
          isLoading={props.timelineIsLoading}
          canComment={props.canComment ?? true}
          commentParentType="task"
          onAddComment={props.onAddComment}
          onEditComment={props.onEditComment}
          onDeleteComment={props.onDeleteComment}
          onAddReaction={props.onAddReaction}
          onRemoveReaction={props.onRemoveReaction}
          richTextHandlers={props.richTextHandlers}
          commentDraftKey={props.localDraftKeyBase ? `${props.localDraftKeyBase}:new-comment` : undefined}
          filters={props.timelineFilters}
          formattedTimePreferences={props.formattedTimePreferences}
          commentNotificationInfo={{
            entityLabel: "task",
            subscribedPeople: props.subscriptions.subscribedPeople ?? [],
            isCurrentUserSubscribed: props.subscriptions.isSubscribed,
            currentUserId: props.currentUser.id,
          }}
        />
      </div>
    );
  }

  // Fallback for when timeline data is not provided
  return (
    <div>
      <h3 className="font-bold mb-4">{t("Comments & Activity")}</h3>
      <div className="text-content-dimmed text-center py-8">{t("Timeline data not available")}</div>
    </div>
  );
}
