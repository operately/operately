import { getRecentPreviewNodes, sortDocsAndFilesItems } from "./sorting";

describe("DocsAndFiles sorting", () => {
  test("keeps folders first and sorts non-folders by name ascending", () => {
    const items = [
      { id: "2", name: "Spec", type: "document" as const, insertedAt: "2026-01-02T10:00:00Z" },
      { id: "1", name: "Archive", type: "folder" as const, insertedAt: "2026-01-01T10:00:00Z" },
      { id: "3", name: "Assets", type: "folder" as const, insertedAt: "2026-01-03T10:00:00Z" },
      { id: "4", name: "Brief", type: "document" as const, insertedAt: "2026-01-04T10:00:00Z" },
    ];

    const result = sortDocsAndFilesItems(items, "name");

    expect(result.map((item) => item.name)).toEqual(["Archive", "Assets", "Brief", "Spec"]);
  });

  test("uses updatedAt before insertedAt when choosing recent preview nodes", () => {
    const nodes = [
      { id: "1", name: "Older", type: "document" as const, updatedAt: "2026-01-01T10:00:00Z" },
      { id: "2", name: "Newest", type: "document" as const, updatedAt: "2026-01-03T10:00:00Z" },
      { id: "3", name: "Fallback", type: "document" as const, insertedAt: "2026-01-02T10:00:00Z" },
    ];

    const result = getRecentPreviewNodes(nodes as any, 2);

    expect(result.map((node) => node.name)).toEqual(["Newest", "Fallback"]);
  });
});
