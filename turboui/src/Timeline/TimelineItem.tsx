import React from "react";
import { CommentItem } from "../CommentSection/CommentItem";
import {
  MilestoneCompletedActivity,
  MilestoneReopenedActivity,
  MilestoneCreatedActivity,
  MilestoneDescriptionActivity,
  MilestoneUpdateActivity,
  AcknowledgmentActivity,
} from "./ActivityComponents";
import { TaskActivityItem } from "./TaskActivities";
import { TimelineItemProps } from "./types";

export function TimelineItem({
  item,
  currentUser,
  canComment,
  commentParentType,
  onEditComment,
  onDeleteComment,
  richTextHandlers,
  commentDraftKey,
  onAddReaction,
  onRemoveReaction,
  formattedTimePreferences,
}: TimelineItemProps) {
  switch (item.type) {
    case "comment":
      return (
        <CommentItem
          comment={item.value}
          form={{
            items: [],
            submitting: false,
            postComment: () => {},
            editComment: onEditComment,
            deleteComment: onDeleteComment,
            editCommentDraftKey: (commentId: string) =>
              commentDraftKey ? `${commentDraftKey}:edit-comment:${commentId}` : undefined,
          }}
          commentParentType={commentParentType}
          canComment={canComment}
          currentUserId={currentUser.id}
          richTextHandlers={richTextHandlers}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
          formattedTimePreferences={formattedTimePreferences}
        />
      );

    case "task-activity":
      return <TaskActivityItem activity={item.value} formattedTimePreferences={formattedTimePreferences} />;

    case "milestone-activity":
      if (item.value.type === "milestone-completed") {
        return <MilestoneCompletedActivity activity={item.value} formattedTimePreferences={formattedTimePreferences} />;
      } else if (item.value.type === "milestone-reopened") {
        return <MilestoneReopenedActivity activity={item.value} formattedTimePreferences={formattedTimePreferences} />;
      } else if (item.value.type === "project_milestone_creation") {
        return <MilestoneCreatedActivity activity={item.value} formattedTimePreferences={formattedTimePreferences} />;
      } else if (item.value.type === "milestone_description_updating") {
        return <MilestoneDescriptionActivity activity={item.value} formattedTimePreferences={formattedTimePreferences} />;
      } else if (item.value.type === "milestone_update") {
        return <MilestoneUpdateActivity activity={item.value} formattedTimePreferences={formattedTimePreferences} />;
      }
      return null;

    case "acknowledgment":
      return (
        <AcknowledgmentActivity
          person={item.value}
          ackAt={item.insertedAt}
          formattedTimePreferences={formattedTimePreferences}
        />
      );

    default:
      return null;
  }
}
