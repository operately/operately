import { TaskPage } from "turboui";

import { sortTaskTimelineItems } from "./prepareTaskTimelineItems";

describe("sortTaskTimelineItems", () => {
  it("keeps an optimistic activity before a later confirmed comment", () => {
    const firstComment = timelineItem("comment", "comment-1", "2026-07-17T10:00:00Z");
    const assigneeActivity = timelineItem("task-activity", "temp-task_assignee_updating-1", "2026-07-17T10:01:00Z");
    const secondComment = timelineItem("comment", "comment-2", "2026-07-17T10:02:00Z");

    const result = sortTaskTimelineItems([secondComment, assigneeActivity, firstComment]);

    expect(result.map((item) => item.value.id)).toEqual(["comment-1", "temp-task_assignee_updating-1", "comment-2"]);
  });

  it("keeps a pending comment at the end until it is confirmed", () => {
    const firstComment = timelineItem("comment", "comment-1", "2026-07-17T10:00:00Z");
    const pendingComment = timelineItem("comment", "temp-comment-2", "2026-07-17T10:01:00Z");
    const assigneeActivity = timelineItem("task-activity", "temp-task_assignee_updating-1", "2026-07-17T10:02:00Z");

    const result = sortTaskTimelineItems([pendingComment, assigneeActivity, firstComment]);

    expect(result.map((item) => item.value.id)).toEqual([
      "comment-1",
      "temp-task_assignee_updating-1",
      "temp-comment-2",
    ]);
  });
});

function timelineItem(type: "comment" | "task-activity", id: string, insertedAt: string) {
  return {
    type,
    value: { id, insertedAt },
  } as TaskPage.TimelineItemType;
}
