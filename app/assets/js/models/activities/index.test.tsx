import type { Activity } from "@/api";

import { aggregateConsecutiveFeedActivities, getAggregatedActivities } from ".";

describe("aggregateConsecutiveFeedActivities", () => {
  test("aggregates consecutive document edit activities by the same author", () => {
    const activities = [
      documentEditedActivity("activity-1", "document-1", "2026-05-26T10:04:00Z"),
      documentEditedActivity("activity-2", "document-2", "2026-05-26T10:03:00Z"),
      documentEditedActivity("activity-3", "document-3", "2026-05-26T10:02:00Z", "other-author"),
      documentEditedActivity("activity-4", "document-4", "2026-05-26T10:01:00Z"),
    ];

    const result = aggregateConsecutiveFeedActivities(activities);

    expect(result).toHaveLength(3);
    expect(result[0]?.id).toEqual("activity-1");
    expect(result[0]?.insertedAt).toEqual("2026-05-26T10:03:00Z");
    expect(getAggregatedActivities(result[0]!).map((activity) => activity.id)).toEqual(["activity-1", "activity-2"]);
    expect(getAggregatedActivities(result[1]!).map((activity) => activity.id)).toEqual(["activity-3"]);
    expect(getAggregatedActivities(result[2]!).map((activity) => activity.id)).toEqual(["activity-4"]);
  });
});

function documentEditedActivity(id: string, documentId: string, insertedAt: string, authorId = "author-1"): Activity {
  return {
    id,
    action: "resource_hub_document_edited",
    insertedAt,
    author: {
      id: authorId,
      fullName: "Jo Writer",
      title: "",
      avatarUrl: null,
      email: "jo@example.com",
      type: "person",
    },
    content: {
      space: { id: "space-1", name: "General" },
      document: { id: documentId, name: `Document ${documentId}` },
    },
  } as Activity;
}
