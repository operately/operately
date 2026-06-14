import * as React from "react";

import {
  AddFileWidget,
  AddFilesButton,
  AddFolderModal,
  FileDragAndDropArea,
  NewFileModalsProvider,
  NodeMenu,
  ResourceHubNodesListProvider,
  type ResourceHubNode,
  useNewFileModalsContext,
} from "../ResourceHub";
import { DocsAndFiles, DocsAndFilesBody, DocsAndFilesDraftPrompt } from "../DocsAndFiles";
import {
  getNodeAuthorName,
  getNodeChildrenCount,
  getNodeCommentsCount,
  getNodeContentType,
  getNodeDescription,
  getNodeId,
  getNodeName,
  getNodeThumbnail,
  getNodeType,
  hasNodeContentType,
  isNodeMovFile,
  isNodeVideoFile,
} from "../ResourceHub/selectors";
import { plurarize } from "../utils/plurarize";
import { truncate } from "../utils/strings";
import { ProjectPage } from "./index";

export function DocsAndFilesTab({ docsAndFiles }: { docsAndFiles: ProjectPage.DocsAndFiles }) {
  return (
    <NewFileModalsProvider value={docsAndFiles.newFileModals}>
      <ProjectDocsAndFilesTabContent docsAndFiles={docsAndFiles} />
    </NewFileModalsProvider>
  );
}

function ProjectDocsAndFilesTabContent({ docsAndFiles }: { docsAndFiles: ProjectPage.DocsAndFiles }) {
  const { filesSelected, navigateToNewDocument, navigateToNewLink, selectFiles, toggleShowAddFolder } = useNewFileModalsContext();
  const items = React.useMemo(
    () => docsAndFiles.nodesListProps.nodes.flatMap((node) => mapNodeToItem(node, docsAndFiles)),
    [docsAndFiles],
  );
  const draftPrompt = React.useMemo(() => buildDraftPrompt(docsAndFiles), [docsAndFiles]);
  const [sortBy, setSortBy] = React.useState<DocsAndFiles.SortBy>("name");

  return (
    <ResourceHubNodesListProvider value={docsAndFiles.nodesListProps.listContext}>
      <FileDragAndDropArea onFilesDropped={docsAndFiles.newFileModals.setFiles}>
        <div className="flex-1 overflow-auto p-4 max-w-6xl mx-auto my-6" data-test-id="docs-and-files-tab">
          <div className="flex items-start justify-between gap-4 border-b border-surface-outline pb-4">
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold tracking-tight">
                {docsAndFiles.resourceHub.name ?? "Documents & Files"}
              </div>
            </div>
            <AddFilesButton
              permissions={docsAndFiles.resourceHub.permissions}
              onNewDocument={navigateToNewDocument}
              onNewFolder={toggleShowAddFolder}
              onUploadFiles={selectFiles}
              onNewLink={navigateToNewLink}
            />
          </div>

          <DocsAndFilesDraftPrompt prompt={draftPrompt} />
          <AddFileWidget {...docsAndFiles.addFileWidgetProps} />
          <DocsAndFilesBody
            items={items}
            emptyStateKind="resourceHub"
            hideEmptyState={filesSelected}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
          <AddFolderModal {...docsAndFiles.addFolderModalProps} />
        </div>
      </FileDragAndDropArea>
    </ResourceHubNodesListProvider>
  );
}

function buildDraftPrompt(docsAndFiles: ProjectPage.DocsAndFiles): DocsAndFiles.DraftPrompt | null {
  if (docsAndFiles.drafts.nodes.length < 1) return null;

  const firstDraft = docsAndFiles.drafts.nodes[0];
  const link =
    docsAndFiles.drafts.nodes.length === 1 && firstDraft
      ? docsAndFiles.drafts.getDraftEditPath(firstDraft) || docsAndFiles.nodesListProps.getNodePath(firstDraft)
      : docsAndFiles.drafts.draftsPath;

  return {
    count: docsAndFiles.drafts.nodes.length,
    link,
  };
}

function mapNodeToItem(node: ResourceHubNode, docsAndFiles: ProjectPage.DocsAndFiles): DocsAndFiles.Item[] {
  const type = getNodeType(node);

  if (!type) return [];

  return [
    {
      id: getNodeId(node) ?? docsAndFiles.nodesListProps.getNodePath(node),
      name: getNodeName(node),
      type,
      link: docsAndFiles.nodesListProps.getNodePath(node),
      insertedAt: node.insertedAt,
      updatedAt: node.updatedAt,
      commentsCount: getNodeCommentsCount(node),
      details: buildNodeDetails(node, docsAndFiles),
      fileKind: buildFileKind(node),
      fileTypeLabel: buildFileTypeLabel(node),
      thumbnail: buildThumbnail(node),
      menu: <NodeMenu node={node} />,
    },
  ];
}

function buildNodeDetails(node: ResourceHubNode, docsAndFiles: ProjectPage.DocsAndFiles): string[] {
  if (getNodeType(node) === "folder") {
    const childrenCount = getNodeChildrenCount(node);

    if (childrenCount === null) return [];

    return [plurarize(childrenCount, "item", "items")];
  }

  return [
    getNodeAuthorName(node),
    buildFileSize(node, docsAndFiles),
    buildContentSnippet(node),
  ].filter((detail): detail is string => Boolean(detail));
}

function buildFileSize(node: ResourceHubNode, docsAndFiles: ProjectPage.DocsAndFiles) {
  const size = node.file?.size;

  if (getNodeType(node) !== "file" || size === undefined || size === null) return null;

  return docsAndFiles.addFileWidgetProps.formatFileSize(size);
}

function buildContentSnippet(node: ResourceHubNode) {
  const nodeType = getNodeType(node);
  const description = getNodeDescription(node);

  if (nodeType === "folder" || nodeType === "link" || !description) return null;

  return truncate(description, 60);
}

function buildFileKind(node: ResourceHubNode): DocsAndFiles.FileKind | undefined {
  if (getNodeType(node) !== "file") return undefined;
  if (hasNodeContentType(node, "image")) return "image";
  if (hasNodeContentType(node, "pdf")) return "pdf";
  if (isNodeMovFile(node)) return "mov";
  if (isNodeVideoFile(node)) return "video";
  if (hasNodeContentType(node, "audio")) return "audio";
  if (hasNodeContentType(node, "zip")) return "zip";

  return "default";
}

function buildFileTypeLabel(node: ResourceHubNode) {
  const contentType = getNodeContentType(node);

  if (getNodeType(node) !== "file" || !contentType) return undefined;
  if (isNodeMovFile(node)) return "MOV";

  return contentType.split("/").pop()?.toUpperCase();
}

function buildThumbnail(node: ResourceHubNode) {
  const thumbnail = getNodeThumbnail(node);

  if (!thumbnail || !hasNodeContentType(node, "image")) return null;

  return thumbnail;
}
