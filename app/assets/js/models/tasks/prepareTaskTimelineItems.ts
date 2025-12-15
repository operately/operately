import { Paths } from "@/routes/paths";
import * as Activities from "@/models/activities";
import * as Comments from "@/models/comments";
import { parseActivitiesForTurboUi } from "@/models/activities/feed";
import { TaskPage } from "turboui";

export function prepareTaskTimelineItems(paths: Paths, activities: Activities.Activity[], comments: Comments.Comment[]) {
  const parsedActivities = parseActivitiesForTurboUi(paths, activities, "task").map((activity) => ({
    type: "task-activity",
    value: activity,
  }));
  const parsedComments = Comments.parseCommentsForTurboUi(paths, comments).map((comment) => ({
    type: "comment",
    value: comment,
  }));

  const timelineItems = [...parsedActivities, ...parsedComments] as TaskPage.TimelineItemType[];

  timelineItems.sort((a, b) => {
    const aIsTemp = a.value.id.startsWith("temp-");
    const bIsTemp = b.value.id.startsWith("temp-");

    if (aIsTemp && !bIsTemp) return 1;
    if (!aIsTemp && bIsTemp) return -1;

    const aInsertedAt = a.type === "acknowledgment" ? a.insertedAt : a.value.insertedAt;
    const bInsertedAt = b.type === "acknowledgment" ? b.insertedAt : b.value.insertedAt;

    return aInsertedAt.localeCompare(bInsertedAt);
  });

  return timelineItems;
}
