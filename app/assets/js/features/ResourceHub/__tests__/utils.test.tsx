import { sortNodesWithFoldersFirst } from "../utils";

// Mock data for testing
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

describe("sortNodesWithFoldersFirst", () => {
  test("sorts by name ascending", () => {
    const result = sortNodesWithFoldersFirst(mockNodes, "name", "asc");
    
    // Folders should come first, sorted by name
    expect(result[0]!.name).toBe("Folder A");
    expect(result[1]!.name).toBe("Folder Z");
    
    // Then other items sorted by name
    expect(result[2]!.name).toBe("Document A");
    expect(result[3]!.name).toBe("Document B");
    expect(result[4]!.name).toBe("File X");
  });

  test("sorts by updatedAt descending (most recent first)", () => {
    const result = sortNodesWithFoldersFirst(mockNodes, "updatedAt", "desc");
    
    // Folders first (no date sorting for folders)
    expect(result[0]!.type).toBe("folder");
    expect(result[1]!.type).toBe("folder");
    
    // Documents by updatedAt desc: A (Jan 15), B (Jan 10), then File X (Jan 5, fallback to insertedAt)
    const nonFolders = result.slice(2);
    expect(nonFolders[0]!.name).toBe("Document A"); // Jan 15
    expect(nonFolders[1]!.name).toBe("Document B"); // Jan 10
    expect(nonFolders[2]!.name).toBe("File X");     // Jan 5
  });

  test("sorts by insertedAt descending", () => {
    const result = sortNodesWithFoldersFirst(mockNodes, "insertedAt", "desc");
    
    // Skip folders
    const nonFolders = result.slice(2);
    
    // By insertedAt desc: File X (Jan 5), Document B (Jan 2), Document A (Jan 1)
    expect(nonFolders[0]!.name).toBe("File X");     // Jan 5
    expect(nonFolders[1]!.name).toBe("Document B"); // Jan 2
    expect(nonFolders[2]!.name).toBe("Document A"); // Jan 1
  });
});