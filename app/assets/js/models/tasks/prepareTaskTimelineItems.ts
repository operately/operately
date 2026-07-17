import { Paths } from "@/routes/paths";
import * as Activities from "@/models/activities";
import * as Comments from "@/models/comments";
import { parseActivitiesForTurboUi } from "@/models/activities/feed";
import { TaskPage } from "turboui";

export function prepareTaskTimelineItems(
  paths: Paths,
  activities: Activities.Activity[],
  comments: Comments.Comment[],
) {
  const parsedActivities = parseActivitiesForTurboUi(paths, activities, "task").map((activity) => ({
    type: "task-activity",
    value: activity,
  }));
  const parsedComments = Comments.parseCommentsForTurboUi(paths, comments).map((comment) => ({
    type: "comment",
    value: comment,
  }));

  return sortTaskTimelineItems([...parsedActivities, ...parsedComments] as TaskPage.TimelineItemType[]);
}

export function sortTaskTimelineItems(items: TaskPage.TimelineItemType[]) {
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    const aIsPendingComment = isPendingComment(a);
    const bIsPendingComment = isPendingComment(b);

    if (aIsPendingComment && !bIsPendingComment) return 1;
    if (!aIsPendingComment && bIsPendingComment) return -1;

    return timelineItemTimestamp(a).localeCompare(timelineItemTimestamp(b));
  });

  return sortedItems;
}

function isPendingComment(item: TaskPage.TimelineItemType) {
  return item.type === "comment" && item.value.id.startsWith("temp-");
}

function timelineItemTimestamp(item: TaskPage.TimelineItemType) {
  return item.type === "acknowledgment" ? item.insertedAt : item.value.insertedAt;
}
