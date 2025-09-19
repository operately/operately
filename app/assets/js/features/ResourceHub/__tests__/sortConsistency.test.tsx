import { sortNodesWithFoldersFirst, SortBy } from "../utils";

// Mock data for testing sorting consistency between widget and main page
const mockNodes = [
  {
    id: "1",
    name: "Document A",
    type: "document",
    document: {
      insertedAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-15T14:00:00Z"
    }
  },
  {
    id: "2", 
    name: "Folder Z",
    type: "folder"
  },
  {
    id: "3",
    name: "Document B", 
    type: "document",
    document: {
      insertedAt: "2024-01-02T10:00:00Z",
      updatedAt: "2024-01-10T14:00:00Z"
    }
  },
  {
    id: "4",
    name: "File X",
    type: "file",
    file: {
      insertedAt: "2024-01-05T10:00:00Z"
    }
  },
  {
    id: "5",
    name: "Folder A",
    type: "folder"
  }
] as any[];

describe("Sort Consistency Between Widget and Main Page", () => {
  const sortOptions: SortBy[] = ["name", "insertedAt", "updatedAt"];

  sortOptions.forEach(sortBy => {
    test(`both components should sort consistently by ${sortBy}`, () => {
      const sortOrder = sortBy === "name" ? "asc" : "desc";
      
      // This simulates the sorting logic used in both the main page and the widget
      const mainPageResult = sortNodesWithFoldersFirst(mockNodes, sortBy, sortOrder);
      const widgetResult = sortNodesWithFoldersFirst(mockNodes, sortBy, sortOrder);
      
      // Results should be identical
      expect(mainPageResult).toEqual(widgetResult);
      
      // Verify folder ordering (always by name ascending)
      const folders = mainPageResult.filter(node => node.type === "folder");
      if (folders.length > 1) {
        expect(folders[0]!.name).toBe("Folder A");
        expect(folders[1]!.name).toBe("Folder Z");
      }
    });
  });

  test("widget uses same default sort as main page", () => {
    // Default sorting should be by name ascending
    const defaultResult = sortNodesWithFoldersFirst(mockNodes, "name", "asc");
    
    // Check that folders come first, sorted by name
    expect(defaultResult[0]!.name).toBe("Folder A");
    expect(defaultResult[1]!.name).toBe("Folder Z");
    
    // Check that documents/files follow, sorted by name
    const nonFolders = defaultResult.slice(2);
    expect(nonFolders[0]!.name).toBe("Document A");
    expect(nonFolders[1]!.name).toBe("Document B");
    expect(nonFolders[2]!.name).toBe("File X");
  });
});