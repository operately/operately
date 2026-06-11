import { parseISO } from "../utils/time";
import type { ResourceHubSortBy } from "./types";

type SortOrder = "asc" | "desc";

export interface SortableResourceHubNode {
  name?: string | null;
  type?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export function sortNodesWithFoldersFirst<T extends SortableResourceHubNode>(
  nodes: T[],
  sortBy: ResourceHubSortBy = "name",
  sortOrder: SortOrder = "desc",
) {
  const folders: T[] = [];
  const others: T[] = [];

  nodes.forEach((node) => {
    if (node.type === "folder") {
      folders.push(node);
    } else {
      others.push(node);
    }
  });

  // Always sort folders by name (ascending), regardless of the sort criteria
  const folderSortFn = createSortFunction<T>("name", "asc");
  folders.sort(folderSortFn);

  // Sort other items by the specified criteria
  const sortFn = createSortFunction<T>(sortBy, sortOrder);
  others.sort(sortFn);

  return [...folders, ...others];
}

function createSortFunction<T extends SortableResourceHubNode>(sortBy: ResourceHubSortBy, sortOrder: SortOrder) {
  return (a: T, b: T) => {
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

function getInsertedAt(node: SortableResourceHubNode): string | null {
  return node.insertedAt ?? null;
}

function getUpdatedAt(node: SortableResourceHubNode): string | null {
  return node.updatedAt ?? null;
}

function compareDates(dateA: string | null, dateB: string | null): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  const parsedA = parseISO(dateA);
  const parsedB = parseISO(dateB);

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
