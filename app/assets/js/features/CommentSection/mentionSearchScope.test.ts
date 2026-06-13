import { findMentionedScope } from "./mentionSearchScope";

describe("findMentionedScope", () => {
  test("uses the resource hub scope for document comments", () => {
    expect(
      findMentionedScope({
        parentType: "resource_hub_document",
        document: {
          id: "document-1",
          resourceHub: {
            id: "hub-1",
            project: { id: "project-1", name: "Apollo" },
          },
        },
      } as any),
    ).toEqual({ type: "resource_hub", id: "hub-1" });
  });

  test("uses the resource hub scope for file comments", () => {
    expect(
      findMentionedScope({
        parentType: "resource_hub_file",
        file: {
          id: "file-1",
          resourceHub: {
            id: "hub-1",
          },
        },
      } as any),
    ).toEqual({ type: "resource_hub", id: "hub-1" });
  });

  test("uses the resource hub scope for link comments", () => {
    expect(
      findMentionedScope({
        parentType: "resource_hub_link",
        link: {
          id: "link-1",
          resourceHub: {
            id: "hub-1",
          },
        },
      } as any),
    ).toEqual({ type: "resource_hub", id: "hub-1" });
  });
});
