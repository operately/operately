import type { ResourceHubNode } from "../ResourceHub/types";
import { nodeDisplayInsertedAt } from "../utils/drafts";
import { NAME_AND_DATE_SORT_OPTIONS, sortWithFoldersFirst } from "../utils/sortWithFoldersFirst";

export const DOCS_AND_FILES_SORT_OPTIONS = NAME_AND_DATE_SORT_OPTIONS;

type DocsAndFilesSortableItem = {
  name?: string | null;
  type?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
};

export function sortDocsAndFilesItems<T extends DocsAndFilesSortableItem>(
  items: T[],
  sortBy: "name" | "insertedAt" | "updatedAt",
): T[] {
  const sortDirection = sortBy === "name" ? "asc" : "desc";

  return sortWithFoldersFirst(items, sortBy, sortDirection);
}

export function getRecentPreviewNodes(nodes: ResourceHubNode[], limit: number): ResourceHubNode[] {
  return [...nodes].sort(compareNodesByUpdatedAt).slice(0, limit);
}

function compareNodesByUpdatedAt(left: ResourceHubNode, right: ResourceHubNode) {
  return getNodeTimestamp(right) - getNodeTimestamp(left);
}

function getNodeTimestamp(node: ResourceHubNode) {
  return Date.parse(node.updatedAt || nodeDisplayInsertedAt(node) || "") || 0;
}
