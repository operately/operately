import type { TemplateProjectPage } from ".";

type ResourceNode = TemplateProjectPage.ResourceNode;

export function findFolder(nodes: ResourceNode[], folderId: string | null): ResourceNode | null {
  if (!folderId) return null;
  return nodes.find((node) => node.type === "folder" && node.folderId === folderId) ?? null;
}

export function nodesInFolder(nodes: ResourceNode[], folderId: string | null): ResourceNode[] {
  return nodes.filter((node) => node.parentFolderId === folderId);
}

export function folderBreadcrumbs(nodes: ResourceNode[], folderId: string | null): ResourceNode[] {
  const folder = findFolder(nodes, folderId);
  if (!folder) return [];
  return [...folderBreadcrumbs(nodes, folder.parentFolderId), folder];
}

export function blockedDestinationFolderIds(node: ResourceNode, nodes: ResourceNode[]): Set<string> {
  if (node.type !== "folder" || !node.folderId) return new Set();
  return collectDescendantFolderIds(nodes, node.folderId);
}

function collectDescendantFolderIds(nodes: ResourceNode[], folderId: string): Set<string> {
  const ids = new Set<string>([folderId]);

  for (const child of nodesInFolder(nodes, folderId)) {
    if (child.type !== "folder" || !child.folderId) continue;
    for (const id of collectDescendantFolderIds(nodes, child.folderId)) ids.add(id);
  }

  return ids;
}
