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
