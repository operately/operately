import { displayDate, nodeDisplayInsertedAt, withNodeDisplayInsertedAt } from "./drafts";

describe("drafts", () => {
  test("displayDate returns insertedAt for drafts", () => {
    expect(displayDate({ state: "draft", insertedAt: "2026-01-01T10:00:00Z" })).toBe("2026-01-01T10:00:00Z");
  });

  test("displayDate returns publishedAt for published resources", () => {
    expect(
      displayDate({
        state: "published",
        insertedAt: "2026-01-01T10:00:00Z",
        publishedAt: "2026-01-05T10:00:00Z",
      }),
    ).toBe("2026-01-05T10:00:00Z");
  });

  test("nodeDisplayInsertedAt uses document publish date for published documents", () => {
    const node = {
      type: "document" as const,
      insertedAt: "2026-01-01T10:00:00Z",
      document: {
        state: "published",
        insertedAt: "2026-01-01T10:00:00Z",
        publishedAt: "2026-01-05T10:00:00Z",
      },
    };

    expect(nodeDisplayInsertedAt(node)).toBe("2026-01-05T10:00:00Z");
  });

  test("withNodeDisplayInsertedAt overrides node insertedAt for published documents", () => {
    const node = {
      type: "document" as const,
      insertedAt: "2026-01-01T10:00:00Z",
      document: {
        state: "published",
        insertedAt: "2026-01-01T10:00:00Z",
        publishedAt: "2026-01-05T10:00:00Z",
      },
    };

    expect(withNodeDisplayInsertedAt(node).insertedAt).toBe("2026-01-05T10:00:00Z");
  });
});
