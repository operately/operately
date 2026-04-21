import { parseCommentContent, stringifyCommentContent } from "./index";

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
