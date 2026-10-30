import type { Activity } from "@/api";

import { aggregateConsecutiveFeedActivities, getAggregatedActivities } from ".";

describe("aggregateConsecutiveFeedActivities", () => {
  const newActions = [
    "task_archive_updating",
    "task_deleting",
    "task_moving",
    "task_milestone_updating",
    "project_milestone_creation",
    "project_milestone_updating",
    "milestone_title_updating",
    "milestone_due_date_updating",
    "milestone_deleting",
    "project_milestone_commented",
  ];

  function batchActivity(action: string, id: string, overrides: Record<string, unknown> = {}): Activity {
    return {
      ...taskAddingActivity(id, id, "2026-05-26T10:04:00Z"),
      action,
      content: {
        project: { id: "project" },
        space: { id: "space" },
        archived: true,
        originType: "project",
        destinationType: "space",
        originProject: { id: "origin" },
        destinationSpace: { id: "destination" },
        oldMilestone: null,
        newMilestone: { id: "milestone" },
        commentAction: "complete",
        comment: { content: "{}" },
        ...overrides,
      },
    } as unknown as Activity;
  }

  test.each(newActions)("groups compatible %s and preserves identity and earliest timestamp", (action) => {
    const first = batchActivity(action, "first");
    const second = { ...batchActivity(action, "second"), insertedAt: "2026-05-26T10:03:00Z" };
    const result = aggregateConsecutiveFeedActivities([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("first");
    expect(result[0]?.insertedAt).toBe(second.insertedAt);
  });

  test.each(newActions)("fails closed for missing context, authors, days, and interruptions for %s", (action) => {
    const first = batchActivity(action, "first");
    for (const second of [
      { ...batchActivity(action, "second"), content: {} },
      { ...batchActivity(action, "second"), author: undefined },
      { ...batchActivity(action, "second"), author: author("other") },
      { ...batchActivity(action, "second"), insertedAt: "2026-05-27T10:04:00Z" },
      batchActivity(action, "second", { project: { id: "other" }, originProject: { id: "other" } }),
      batchActivity(action, "second", { project: { id: "" }, originProject: { id: "" } }),
    ]) {
      expect(aggregateConsecutiveFeedActivities([first, second as Activity])).toHaveLength(2);
    }
    expect(
      aggregateConsecutiveFeedActivities([first, taskEditedActivity("interruption", first.insertedAt!), first]),
    ).toHaveLength(3);
  });

  test.each([
    ["task_archive_updating", { archived: false }],
    ["task_archive_updating", { archived: undefined }],
    ["task_deleting", { project: null, space: { id: "other" } }],
    ["task_moving", { originProject: { id: "other" } }],
    ["task_moving", { destinationSpace: { id: "other" } }],
    ["task_moving", { originType: "space" }],
    ["task_moving", { destinationType: "project" }],
    ["task_milestone_updating", { oldMilestone: { id: "old" } }],
    ["task_milestone_updating", { newMilestone: null }],
    ["task_milestone_updating", { newMilestone: {} }],
  ])("separates incompatible %s transitions (%j)", (action, overrides) => {
    expect(
      aggregateConsecutiveFeedActivities([
        batchActivity(String(action), "first"),
        batchActivity(String(action), "second", overrides as Record<string, unknown>),
      ]),
    ).toHaveLength(2);
  });

  test.each([undefined, null, "", "  ", "{}", " { } "])("groups bodyless lifecycle comments (%j)", (body) => {
    for (const commentAction of ["complete", "reopen"]) {
      const activities = ["first", "second"].map((id) =>
        batchActivity("project_milestone_commented", id, { commentAction, comment: { content: body } }),
      );
      expect(aggregateConsecutiveFeedActivities(activities)).toHaveLength(1);
    }
  });

  test.each(["broken", "null", "[]", "42", '{"type":"doc","content":[]}', '{"text":"Explanation"}'])(
    "does not group nonempty or malformed lifecycle bodies (%s)",
    (body) => {
      const first = batchActivity("project_milestone_commented", "first");
      const second = batchActivity("project_milestone_commented", "second", { comment: { content: body } });
      expect(aggregateConsecutiveFeedActivities([first, second, first])).toHaveLength(3);
    },
  );

  test("keeps completion, reopening, ordinary comments, and different milestone actions separate", () => {
    const activities = ["complete", "reopen", "none"].map((commentAction) =>
      batchActivity("project_milestone_commented", commentAction, { commentAction }),
    );
    expect(aggregateConsecutiveFeedActivities(activities)).toHaveLength(3);
    expect(
      aggregateConsecutiveFeedActivities([
        batchActivity("milestone_title_updating", "first"),
        batchActivity("milestone_due_date_updating", "second"),
      ]),
    ).toHaveLength(2);
  });
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
    __typename: "activity",
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
    __typename: "activity",
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
    __typename: "activity",
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
    __typename: "activity",
    id,
    action: "task_name_updating",
    insertedAt,
    author: author("author-1"),
    content: {},
  } as unknown as Activity;
}

function taskAssigneeActivity(
  id: string,
  taskId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    __typename: "activity",
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
  } as unknown as Activity;
}

function taskAddingActivity(
  id: string,
  taskId: string,
  insertedAt: string,
  authorId = "author-1",
  spaceId = "space-1",
): Activity {
  return {
    __typename: "activity",
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
    __typename: "activity",
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
