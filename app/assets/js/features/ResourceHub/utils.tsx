import { ResourceHubNode } from "@/models/resourceHubs";

import * as Time from "@/utils/time";

export type SortBy = "name" | "insertedAt" | "updatedAt";
type SortOrder = "asc" | "desc";

export function sortNodesWithFoldersFirst(
  nodes: ResourceHubNode[],
  sortBy: SortBy = "name",
  sortOrder: SortOrder = "desc",
) {
  const folders: ResourceHubNode[] = [];
  const others: ResourceHubNode[] = [];

  nodes.forEach((node) => {
    if (node.type === "folder") {
      folders.push(node);
    } else {
      others.push(node);
    }
  });

  // Always sort folders by name (ascending), regardless of the sort criteria
  const folderSortFn = createSortFunction("name", "asc");
  folders.sort(folderSortFn);

  // Sort other items by the specified criteria
  const sortFn = createSortFunction(sortBy, sortOrder);
  others.sort(sortFn);

  return [...folders, ...others];
}

function createSortFunction(sortBy: SortBy, sortOrder: SortOrder) {
  return (a: ResourceHubNode, b: ResourceHubNode) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name!.localeCompare(b.name!);
        break;
      case "insertedAt":
        comparison = compareDates(getInsertedAt(a), getInsertedAt(b));
        break;
      case "updatedAt":
        comparison = compareDates(getUpdatedAt(a), getUpdatedAt(b));
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  };
}

function getInsertedAt(node: ResourceHubNode): string | null {
  return node.insertedAt!;
}

function getUpdatedAt(node: ResourceHubNode): string | null {
  return node.updatedAt!;
}

function compareDates(dateA: string | null, dateB: string | null): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  const parsedA = Time.parseISO(dateA);
  const parsedB = Time.parseISO(dateB);

  if (parsedA > parsedB) return 1;
  if (parsedA < parsedB) return -1;
  return 0;
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
