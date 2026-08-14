import type { ProjectTemplate, ProjectTemplateResourceNode } from "@/api";
import { compareIds, type Paths } from "@/routes/paths";

export type NavigationItem = { to: string; label: string };

export function buildProjectTemplateResourceNavigation(
  template: ProjectTemplate,
  paths: Paths,
  opts?: {
    parentFolderId?: string | null;
    current?: NavigationItem;
  },
): NavigationItem[] {
  const items: NavigationItem[] = [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id, { tab: "docs-and-files" }), label: "Docs & Files" },
  ];

  for (const folder of folderAncestors(template.resourceNodes ?? [], opts?.parentFolderId)) {
    const folderId = folder.folder?.id;
    if (!folderId) continue;

    items.push({
      to: paths.projectTemplatePath(template.id, { folderId }),
      label: folder.folder?.name ?? "",
    });
  }

  if (opts?.current) items.push(opts.current);

  return items;
}

function folderAncestors(
  nodes: ProjectTemplateResourceNode[],
  folderId: string | null | undefined,
): ProjectTemplateResourceNode[] {
  const folder = findFolder(nodes, folderId);
  if (!folder) return [];

  return [...folderAncestors(nodes, folder.parentFolderId), folder];
}

function findFolder(
  nodes: ProjectTemplateResourceNode[],
  folderId: string | null | undefined,
): ProjectTemplateResourceNode | null {
  if (!folderId) return null;

  return nodes.find((node) => node.type === "folder" && compareIds(node.folder?.id, folderId)) ?? null;
}
