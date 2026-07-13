import {
  insertAcknowledgement,
  isOptimisticComment,
  parseCommentContent,
  stringifyCommentContent,
  type CommentItem,
} from "./index";

describe("comment content helpers", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses flat rich text content", () => {
    const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] };

    expect(parseCommentContent(JSON.stringify(content))).toEqual(content);
  });

  it("treats empty maps as empty comment content", () => {
    expect(parseCommentContent("{}")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseCommentContent("{not-json}")).toBeNull();
  });

  it("stringifies flat rich text content without wrapping it", () => {
    const content = { type: "doc", content: [] };

    expect(stringifyCommentContent(content)).toBe(JSON.stringify(content));
  });
});

describe("insertAcknowledgement", () => {
  const person = { id: "person-1", fullName: "Reviewer" };

  function comment(id: string, insertedAt: string): CommentItem {
    return {
      type: "comment",
      insertedAt: new Date(insertedAt),
      value: { id, insertedAt, content: "{}", author: person, reactions: [] },
    };
  }

  it("inserts acknowledgement between earlier and later comments", () => {
    const items = [comment("c1", "2024-01-01T10:00:00.000Z"), comment("c2", "2024-01-01T12:00:00.000Z")];

    const result = insertAcknowledgement(items, "2024-01-01T11:00:00.000Z", person);

    expect(result.map((item) => (item.type === "comment" ? item.value.id : item.type))).toEqual([
      "c1",
      "acknowledgement",
      "c2",
    ]);
  });

  it("keeps optimistic comments after acknowledgement even when their timestamp is earlier", () => {
    const items = [
      comment("c1", "2024-01-01T10:00:00.000Z"),
      comment("c2", "2024-01-01T12:00:00.000Z"),
      comment("temp-123", "2024-01-01T10:30:00.000Z"),
    ];

    const result = insertAcknowledgement(items, "2024-01-01T11:00:00.000Z", person);

    expect(result.map((item) => (item.type === "comment" ? item.value.id : item.type))).toEqual([
      "c1",
      "acknowledgement",
      "c2",
      "temp-123",
    ]);
    expect(isOptimisticComment(result[3]!)).toBe(true);
  });

  it("appends optimistic comments after later comments", () => {
    const items = [
      comment("c1", "2024-01-01T10:00:00.000Z"),
      comment("c2", "2024-01-01T12:00:00.000Z"),
      comment("temp-456", "2024-01-01T13:00:00.000Z"),
    ];

    const result = insertAcknowledgement(items, "2024-01-01T11:00:00.000Z", person);

    expect(result.map((item) => (item.type === "comment" ? item.value.id : item.type))).toEqual([
      "c1",
      "acknowledgement",
      "c2",
      "temp-456",
    ]);
  });
});
