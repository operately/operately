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
  richTextHandlers,
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
          }}
          commentParentType={commentParentType}
          canComment={canComment}
          currentUserId={currentUser.id}
          richTextHandlers={richTextHandlers}
        />
      );

    case "task-activity":
      return <TaskActivityItem activity={item.value} />;

    case "milestone-activity":
      if (item.value.type === "milestone-completed") {
        return <MilestoneCompletedActivity activity={item.value} />;
      } else if (item.value.type === "milestone-reopened") {
        return <MilestoneReopenedActivity activity={item.value} />;
      } else if (item.value.type === "project_milestone_creation") {
        return <MilestoneCreatedActivity activity={item.value} />;
      } else if (item.value.type === "milestone_description_updating") {
        return <MilestoneDescriptionActivity activity={item.value} />;
      } else if (item.value.type === "milestone_update") {
        return <MilestoneUpdateActivity activity={item.value} />;
      }
      return null;

    case "acknowledgment":
      return <AcknowledgmentActivity person={item.value} ackAt={item.insertedAt} />;

    default:
      return null;
  }
}
