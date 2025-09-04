import { ResourceHubNode } from "@/models/resourceHubs";

import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";

import { Paths } from "@/routes/paths";
export type NodeType = "document" | "folder" | "file" | "link";
export type SortBy = "name" | "insertedAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export function findPath(paths: Paths, nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      assertPresent(node.document?.id, "document must be present in node");
      return paths.resourceHubDocumentPath(node.document.id);
    case "folder":
      assertPresent(node.folder?.id, "folder must be present in node");
      return paths.resourceHubFolderPath(node.folder.id);
    case "link":
      assertPresent(node.link?.id, "link must be present in node");
      return paths.resourceHubLinkPath(node.link.id);
    case "file":
      assertPresent(node.file?.id, "file must be present in node");
      return paths.resourceHubFilePath(node.file.id);
  }
}

export function sortNodesWithFoldersFirst(nodes: ResourceHubNode[], sortBy: SortBy = "name", sortOrder: SortOrder = "desc") {
  const folders: ResourceHubNode[] = [];
  const others: ResourceHubNode[] = [];

  nodes.forEach((node) => {
    if (node.type === "folder") {
      folders.push(node);
    } else {
      others.push(node);
    }
  });

  const sortFn = createSortFunction(sortBy, sortOrder);
  folders.sort(sortFn);
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
  if (node.document?.insertedAt) return node.document.insertedAt;
  if (node.file?.insertedAt) return node.file.insertedAt;
  if (node.link?.insertedAt) return node.link.insertedAt;
  return null;
}

function getUpdatedAt(node: ResourceHubNode): string | null {
  if (node.document?.updatedAt) return node.document.updatedAt;
  // Files and links don't have updatedAt, fall back to insertedAt
  if (node.file?.insertedAt) return node.file.insertedAt;
  if (node.link?.insertedAt) return node.link.insertedAt;
  return null;
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

export function findCommentsCount(nodeType: NodeType, node: ResourceHubNode) {
  switch (nodeType) {
    case "document":
      assertPresent(node.document?.commentsCount, "commentsCount must be present in document");
      return node.document.commentsCount;

    case "file":
      assertPresent(node.file?.commentsCount, "commentsCount must be present in file");
      return node.file.commentsCount;

    case "link":
      assertPresent(node.link?.commentsCount, "commentsCount must be present in link");
      return node.link.commentsCount;

    default:
      return 0;
  }
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
