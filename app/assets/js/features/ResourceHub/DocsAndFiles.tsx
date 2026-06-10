import React from "react";

import * as ResourceHubs from "@/models/resourceHubs";
import { Paths, usePaths } from "@/routes/paths";
import { truncateString } from "@/utils/strings";
import plurarize from "@/utils/plurarize";
import { richContentToString, DocsAndFilesTab } from "turboui";
import type { DocsAndFiles, ProjectPage } from "turboui";

import { AddFilesButton } from "./AddFilesButton";
import { AddFileWidget } from "./AddFileWidget";
import { AddFolderModal } from "./AddFolderModal";
import { DocumentMenu, FileMenu, FolderMenu, LinkMenu } from "./components";
import { FileDragAndDropArea } from "./FileDragAndDropArea";
import { resourceHubParentItem } from "./Navigation/resourceHubNavigation";
import { NewFileModalsProvider, useNewFileModalsContext } from "./contexts/NewFileModalsContext";
import { NodesProvider } from "./contexts/NodesContext";
import { findCommentsCount, findPath, NodeType } from "./utils";

const DEFAULT_TITLE = "Documents & Files";
const LEGACY_PROJECT_TITLE = "Docs & Files";

interface ResourceHubDocsAndFilesProps {
  resourceHub: ResourceHubs.ResourceHub;
  nodes: ResourceHubs.ResourceHubNode[];
  refresh: () => void | Promise<void>;
  draftNodes?: ResourceHubs.ResourceHubNode[];
  folder?: ResourceHubs.ResourceHubFolder;
  className?: string;
}

export function ResourceHubDocsAndFiles({
  resourceHub,
  folder,
  nodes,
  draftNodes = [],
  refresh,
  className,
}: ResourceHubDocsAndFilesProps) {
  return (
    <NewFileModalsProvider resourceHub={resourceHub} folder={folder}>
      <ResourceHubDocsAndFilesContent
        resourceHub={resourceHub}
        folder={folder}
        nodes={nodes}
        draftNodes={draftNodes}
        refresh={refresh}
        className={className}
      />
    </NewFileModalsProvider>
  );
}

export function useResourceHubDocsAndFilesProjectProps({
  resourceHub,
  nodes,
  draftNodes = [],
  refresh,
}: Omit<ResourceHubDocsAndFilesProps, "resourceHub"> & {
  resourceHub: ResourceHubs.ResourceHub | null | undefined;
}): ProjectPage.Props["docsAndFiles"] {
  const paths = usePaths();
  const permissions = resourceHub?.permissions;
  const title = displayResourceHubName(resourceHub?.name);
  const items = useDocsAndFilesItems(nodes);
  const draftPrompt = useDraftPrompt(resourceHub, draftNodes);
  const refetch = React.useCallback(() => {
    void refresh();
  }, [refresh]);

  if (!resourceHub || !permissions) return undefined;

  const tabPath = resourceHub.project?.id ? paths.projectPath(resourceHub.project.id, { tab: "docs-and-files" }) : "#";

  return {
    title,
    items,
    tabPath,
    count: nodes.length,
    addAction: <AddFilesButton permissions={permissions} />,
    draftPrompt,
    uploadForm: <AddFileWidget resourceHub={resourceHub} refresh={refetch} />,
    folderModal: <AddFolderModal resourceHub={resourceHub} refresh={refetch} />,
    emptyStateKind: "resourceHub",
    renderTabWrapper: (children) => (
      <NewFileModalsProvider resourceHub={resourceHub}>
        <FileDragAndDropArea>
          <DocsAndFilesNodesProvider resourceHub={resourceHub} nodes={nodes} refetch={refetch}>
            {children}
          </DocsAndFilesNodesProvider>
        </FileDragAndDropArea>
      </NewFileModalsProvider>
    ),
  };
}

function ResourceHubDocsAndFilesContent({
  resourceHub,
  folder,
  nodes,
  draftNodes,
  refresh,
  className,
}: ResourceHubDocsAndFilesProps & { draftNodes: ResourceHubs.ResourceHubNode[] }) {
  const { filesSelected } = useNewFileModalsContext();
  const permissions = folder?.permissions || resourceHub.permissions;
  const title = folder?.name || displayResourceHubName(resourceHub.name);
  const draftPrompt = useDraftPrompt(resourceHub, draftNodes);
  const items = useDocsAndFilesItems(nodes);
  const breadcrumbs = useFolderBreadcrumbs(resourceHub, folder);
  const refetch = React.useCallback(() => {
    void refresh();
  }, [refresh]);

  if (!permissions) return null;

  return (
    <FileDragAndDropArea>
      <DocsAndFilesNodesProvider resourceHub={resourceHub} folder={folder} nodes={nodes} refetch={refetch}>
        <DocsAndFilesTab
          title={title}
          items={items}
          addAction={<AddFilesButton permissions={permissions} />}
          draftPrompt={draftPrompt}
          uploadForm={<AddFileWidget folder={folder} resourceHub={resourceHub} refresh={refetch} />}
          folderModal={<AddFolderModal folder={folder} resourceHub={resourceHub} refresh={refetch} />}
          breadcrumbs={breadcrumbs}
          emptyStateKind={folder ? "folder" : "resourceHub"}
          hideEmptyState={filesSelected}
          className={className}
        />
      </DocsAndFilesNodesProvider>
    </FileDragAndDropArea>
  );
}

function displayResourceHubName(name?: string | null): string {
  if (!name || name === LEGACY_PROJECT_TITLE) return DEFAULT_TITLE;

  return name;
}

function DocsAndFilesNodesProvider({
  resourceHub,
  folder,
  nodes,
  refetch,
  children,
}: {
  resourceHub: ResourceHubs.ResourceHub;
  folder?: ResourceHubs.ResourceHubFolder;
  nodes: ResourceHubs.ResourceHubNode[];
  refetch: () => void;
  children: React.ReactNode;
}) {
  if (folder) {
    return (
      <NodesProvider folder={folder} type="folder" nodes={nodes} refetch={refetch}>
        {children}
      </NodesProvider>
    );
  }

  return (
    <NodesProvider resourceHub={resourceHub} type="resource_hub" nodes={nodes} refetch={refetch}>
      {children}
    </NodesProvider>
  );
}

function useDocsAndFilesItems(nodes: ResourceHubs.ResourceHubNode[]): DocsAndFiles.Item[] {
  const paths = usePaths();

  return React.useMemo(() => nodes.map((node) => toDocsAndFilesItem(paths, node)), [paths, nodes]);
}

function useFolderBreadcrumbs(
  resourceHub: ResourceHubs.ResourceHub,
  folder?: ResourceHubs.ResourceHubFolder,
): DocsAndFiles.Breadcrumb[] | undefined {
  const paths = usePaths();

  if (!folder) return undefined;

  const rootPath = resourceHub.project?.id
    ? paths.projectPath(resourceHub.project.id, { tab: "docs-and-files" })
    : paths.resourceHubPath(resourceHub.id!);
  const ancestors = (folder.pathToFolder || []).filter((ancestor) => ancestor.id && ancestor.id !== folder.id);
  const parentBreadcrumbs = resourceHub.project ? [] : [resourceHubParentItem(paths, resourceHub)];

  return [
    ...parentBreadcrumbs.map((item) => ({
      label: item.label,
      link: item.to,
    })),
    {
      label: displayResourceHubName(resourceHub.name),
      link: rootPath,
    },
    ...ancestors.map((ancestor) => ({
      label: ancestor.name || "",
      link: paths.resourceHubFolderPath(ancestor.id!),
    })),
  ];
}

function useDraftPrompt(
  resourceHub: ResourceHubs.ResourceHub | null | undefined,
  drafts: ResourceHubs.ResourceHubNode[],
): DocsAndFiles.DraftPrompt | null {
  const paths = usePaths();

  if (drafts.length < 1 || !resourceHub?.id) return null;

  if (drafts.length === 1) {
    const documentId = drafts[0]?.document?.id;
    if (!documentId) return null;

    return {
      count: 1,
      link: paths.resourceHubEditDocumentPath(documentId),
    };
  }

  return {
    count: drafts.length,
    link: paths.resourceHubDraftsPath(resourceHub.id),
  };
}

function toDocsAndFilesItem(paths: Paths, node: ResourceHubs.ResourceHubNode): DocsAndFiles.Item {
  const nodeType = node.type as NodeType;

  return {
    id: node.id || `${nodeType}-${node.name}`,
    name: node.name || "",
    type: nodeType,
    link: findPath(paths, nodeType, node),
    insertedAt: node.insertedAt,
    updatedAt: node.updatedAt,
    commentsCount: safeCommentsCount(nodeType, node),
    details: itemDetails(node),
    fileKind: fileKind(node),
    fileTypeLabel: fileTypeLabel(node),
    thumbnail: thumbnail(node),
    menu: itemMenu(node),
  };
}

function itemDetails(node: ResourceHubs.ResourceHubNode): string[] {
  if (node.type === "folder") {
    return folderDetails(node);
  }

  return [authorName(node), fileSize(node), contentSnippet(node)].filter((detail): detail is string => Boolean(detail));
}

function folderDetails(node: ResourceHubs.ResourceHubNode): string[] {
  const childrenCount = node.folder?.childrenCount;
  if (childrenCount === undefined || childrenCount === null) return [];

  return [plurarize(childrenCount, "item", "items")];
}

function authorName(node: ResourceHubs.ResourceHubNode): string | null {
  if (node.type === "document") return node.document?.author?.fullName || null;
  if (node.type === "file") return node.file?.author?.fullName || null;
  if (node.type === "link") return node.link?.author?.fullName || null;
  return null;
}

function fileSize(node: ResourceHubs.ResourceHubNode): string | null {
  const size = node.file?.size;
  if (node.type !== "file" || size === undefined || size === null) return null;

  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)}KB`;
  return `${(size / (1024 * 1024)).toFixed(0)}MB`;
}

function contentSnippet(node: ResourceHubs.ResourceHubNode): string | null {
  const content = richTextContent(node);
  if (!content) return null;

  return truncateString(content, 60);
}

function richTextContent(node: ResourceHubs.ResourceHubNode): string | null {
  const rawContent =
    node.type === "document" ? node.document?.content : node.type === "file" ? node.file?.description : null;
  if (!rawContent) return null;

  try {
    return richContentToString(JSON.parse(rawContent));
  } catch {
    return null;
  }
}

function safeCommentsCount(nodeType: NodeType, node: ResourceHubs.ResourceHubNode): number {
  try {
    return findCommentsCount(nodeType, node);
  } catch {
    return 0;
  }
}

function fileKind(node: ResourceHubs.ResourceHubNode): DocsAndFiles.FileKind | undefined {
  if (node.type !== "file") return undefined;
  if (hasContentType(node, "image")) return "image";
  if (hasContentType(node, "pdf")) return "pdf";
  if (hasContentType(node, "video")) return "video";
  if (hasContentType(node, "audio")) return "audio";
  if (hasContentType(node, "zip")) return "zip";
  if (hasContentType(node, "mov")) return "mov";
  return "default";
}

function fileTypeLabel(node: ResourceHubs.ResourceHubNode): string | undefined {
  const contentType = node.file?.blob?.contentType;
  if (node.type !== "file" || !contentType) return undefined;

  return contentType.split("/").pop()?.toUpperCase();
}

function thumbnail(node: ResourceHubs.ResourceHubNode): DocsAndFiles.Item["thumbnail"] {
  const blob = node.file?.blob;
  if (node.type !== "file" || !blob?.url || !hasContentType(node, "image")) return null;

  return {
    url: blob.url,
    alt: node.name || "File preview",
    width: blob.width,
    height: blob.height,
  };
}

function hasContentType(node: ResourceHubs.ResourceHubNode, contentType: string): boolean {
  return Boolean(node.file?.blob?.contentType?.includes(contentType));
}

function itemMenu(node: ResourceHubs.ResourceHubNode): React.ReactNode {
  if (node.folder) return <FolderMenu folder={node.folder} />;
  if (node.document) return <DocumentMenu document={node.document} />;
  if (node.file) return <FileMenu file={node.file} />;
  if (node.link) return <LinkMenu link={node.link} />;
  return null;
}
