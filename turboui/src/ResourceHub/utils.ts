import { sortWithFoldersFirst, type FoldersFirstSortableItem, type SortDirection } from "../utils/sortWithFoldersFirst";
import type { ResourceHubSortBy } from "./types";

type SortOrder = SortDirection;
export type SortableResourceHubNode = FoldersFirstSortableItem;

export function sortNodesWithFoldersFirst<T extends SortableResourceHubNode>(
  nodes: T[],
  sortBy: ResourceHubSortBy = "name",
  sortOrder: SortOrder = "desc",
) {
  return sortWithFoldersFirst(nodes, sortBy, sortOrder);
}

let nextFileItemId = 0;

/**
 * Generates a stable identifier for a dropped-file row in `AddFileWidget`.
 * Uniqueness only needs to hold within a single browser session/tab, so a
 * module-scoped counter combined with the current time is sufficient — no
 * need for crypto.randomUUID.
 */
export function createFileItemId(): string {
  return `file-item-${Date.now()}-${nextFileItemId++}`;
}

export function findNameAndExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return {
      name: fileName,
      extension: "",
    };
  }

  return {
    name: fileName.slice(0, lastDotIndex),
    extension: fileName.slice(lastDotIndex + 1),
  };
}
