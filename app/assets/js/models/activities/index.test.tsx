import type { Activity } from "@/api";

import { aggregateConsecutiveFeedActivities, getAggregatedActivities } from ".";

describe("aggregateConsecutiveFeedActivities", () => {
  test("aggregates consecutive resource hub edit activities without content snippets by the same author in the same space", () => {
    const activities = [
      documentEditedActivity("activity-1", "document-1", "2026-05-26T10:04:00Z"),
      linkEditedActivity("activity-2", "link-1", "2026-05-26T10:03:00Z"),
      documentEditedActivity("activity-4", "document-2", "2026-05-26T10:01:00Z", "other-author"),
      documentEditedActivity("activity-5", "document-3", "2026-05-26T10:00:00Z"),
    ];

    const result = aggregateConsecutiveFeedActivities(activities);

    expect(result).toHaveLength(3);
    expect(result[0]?.id).toEqual("activity-1");
    expect(result[0]?.insertedAt).toEqual("2026-05-26T10:03:00Z");
    expect(getAggregatedActivities(result[0]!).map((activity) => activity.id)).toEqual(["activity-1", "activity-2"]);
    expect(getAggregatedActivities(result[1]!).map((activity) => activity.id)).toEqual(["activity-4"]);
    expect(getAggregatedActivities(result[2]!).map((activity) => activity.id)).toEqual(["activity-5"]);
  });

  test("does not aggregate resource hub edits across spaces or content-snippet activity interruptions", () => {
    const activities = [
      documentEditedActivity("activity-1", "document-1", "2026-05-26T10:04:00Z"),
      fileEditedActivity("activity-2", "file-1", "2026-05-26T10:03:00Z"),
      linkEditedActivity("activity-3", "link-1", "2026-05-26T10:02:00Z"),
      taskEditedActivity("activity-4", "2026-05-26T10:01:00Z"),
      documentEditedActivity("activity-5", "document-2", "2026-05-26T10:00:00Z"),
    ];

    const result = aggregateConsecutiveFeedActivities(activities);

    expect(result).toHaveLength(5);
    expect(result.map((activity) => getAggregatedActivities(activity).map((item) => item.id))).toEqual([
      ["activity-1"],
      ["activity-2"],
      ["activity-3"],
      ["activity-4"],
      ["activity-5"],
    ]);
  });

  test("aggregates consecutive task updates by the same author and action in the same location", () => {
    const activities = [
      taskAssigneeActivity("activity-1", "task-1", "2026-05-26T10:04:00Z"),
      taskAssigneeActivity("activity-2", "task-2", "2026-05-26T10:03:00Z"),
      taskStatusActivity("activity-3", "task-3", "2026-05-26T10:02:00Z"),
      taskAssigneeActivity("activity-4", "task-4", "2026-05-26T10:01:00Z"),
    ];

    const result = aggregateConsecutiveFeedActivities(activities);

    expect(result).toHaveLength(3);
    expect(result[0]?.insertedAt).toEqual("2026-05-26T10:03:00Z");
    expect(getAggregatedActivities(result[0]!).map((activity) => activity.id)).toEqual(["activity-1", "activity-2"]);
    expect(getAggregatedActivities(result[1]!).map((activity) => activity.id)).toEqual(["activity-3"]);
    expect(getAggregatedActivities(result[2]!).map((activity) => activity.id)).toEqual(["activity-4"]);
  });

  test("aggregates consecutive task creation activities", () => {
    const activities = [
      taskAddingActivity("activity-1", "task-1", "2026-05-26T10:04:00Z"),
      taskAddingActivity("activity-2", "task-2", "2026-05-26T10:03:00Z"),
    ];

    const result = aggregateConsecutiveFeedActivities(activities);

    expect(result).toHaveLength(1);
    expect(result[0]?.insertedAt).toEqual("2026-05-26T10:03:00Z");
    expect(getAggregatedActivities(result[0]!).map((activity) => activity.id)).toEqual(["activity-1", "activity-2"]);
  });

  test("does not aggregate activities across date boundaries", () => {
    const activities = [
      taskAddingActivity("activity-1", "task-1", "2026-05-27T00:01:00"),
      taskAddingActivity("activity-2", "task-2", "2026-05-26T23:59:00"),
    ];

    const result = aggregateConsecutiveFeedActivities(activities);

    expect(result).toHaveLength(2);
    expect(getAggregatedActivities(result[0]!).map((activity) => activity.id)).toEqual(["activity-1"]);
    expect(getAggregatedActivities(result[1]!).map((activity) => activity.id)).toEqual(["activity-2"]);
  });
});

function documentEditedActivity(
  id: string,
  documentId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    id,
    action: "resource_hub_document_edited",
    insertedAt,
    author: author(authorId),
    content: {
      space: { id: spaceId, name: "General" },
      document: { id: documentId, name: `Document ${documentId}` },
    },
  } as Activity;
}

function fileEditedActivity(
  id: string,
  fileId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    id,
    action: "resource_hub_file_edited",
    insertedAt,
    author: author(authorId),
    content: {
      space: { id: spaceId, name: "General" },
      file: { id: fileId, name: `File ${fileId}` },
    },
  } as Activity;
}

function linkEditedActivity(
  id: string,
  linkId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    id,
    action: "resource_hub_link_edited",
    insertedAt,
    author: author(authorId),
    content: {
      space: { id: spaceId, name: "General" },
      link: { id: linkId, name: `Link ${linkId}` },
    },
  } as Activity;
}

function taskEditedActivity(id: string, insertedAt: string): Activity {
  return {
    id,
    action: "task_name_updating",
    insertedAt,
    author: author("author-1"),
    content: {},
  } as Activity;
}

function taskAssigneeActivity(
  id: string,
  taskId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    id,
    action: "task_assignee_updating",
    insertedAt,
    author: author(authorId),
    content: {
      project: null,
      space: { id: spaceId, name: "General" },
      task: { id: taskId, name: `Task ${taskId}` },
      oldAssignee: null,
      newAssignee: null,
      addedAssignees: [],
      removedAssignees: [],
    },
  } as Activity;
}

function taskAddingActivity(
  id: string,
  taskId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    id,
    action: "task_adding",
    insertedAt,
    author: author(authorId),
    content: {
      project: null,
      space: { id: spaceId, name: "General" },
      task: { id: taskId, name: `Task ${taskId}` },
      taskName: `Task ${taskId}`,
    },
  } as Activity;
}

function taskStatusActivity(
  id: string,
  taskId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    id,
    action: "task_status_updating",
    insertedAt,
    author: author(authorId),
    content: {
      project: null,
      space: { id: spaceId, name: "General" },
      task: { id: taskId, name: `Task ${taskId}` },
    },
  } as Activity;
}

function author(id: string) {
  return {
    id,
    fullName: "Jo Writer",
    title: "",
    avatarUrl: null,
    email: "jo@example.com",
    type: "person",
  };
}
