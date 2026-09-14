import * as React from "react";
import { ContentListState } from "../ContentListState";

import {
  AddFileWidget,
  AddFilesButton,
  AddFolderModal,
  FileDragAndDropArea,
  NewFileModalsProvider,
  NodeMenu,
  ResourceHubNodesListProvider,
  ResourceHubSearchInput,
  type AddFileWidgetProps,
  type AddFolderModalProps,
  type NewFileModalsContextValue,
  type ResourceHub,
  type ResourceHubNode,
  useNewFileModalsContext,
  useResourceHubSearch,
} from "../ResourceHub";
import { DocsAndFiles, DocsAndFilesTab } from ".";
import {
  getNodeAuthor,
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
import type { FormattedTimePreferences } from "../FormattedTime";
import type { SharedListPageProps } from "../ResourceHubPage/SharedListPage";
import type { ResourceHubSearchProps } from "../ResourceHubPage/types";
import { nodeDisplayInsertedAt } from "../utils/drafts";
import { plurarize } from "../utils/plurarize";
import { truncate } from "../utils/strings";

export interface PageDocsAndFiles {
  resourceHub: ResourceHub;
  previewNodes: ResourceHubNode[];
  tabPath: string;
  drafts: {
    nodes: ResourceHubNode[];
    draftsPath: string;
  };
  newFileModals: NewFileModalsContextValue;
  addFileWidgetProps: Pick<AddFileWidgetProps, "subscriptions" | "richTextHandlers" | "formatFileSize" | "onUpload">;
  nodesListProps: SharedListPageProps["nodesListProps"];
  addFolderModalProps: AddFolderModalProps;
  search?: ResourceHubSearchProps;
}

export function PageDocsAndFilesTab({
  docsAndFiles,
  formattedTimePreferences,
  loading,
  error,
  onRetry,
}: {
  docsAndFiles?: PageDocsAndFiles;
  formattedTimePreferences: FormattedTimePreferences;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className={docsAndFiles ? undefined : "p-4 max-w-6xl mx-auto my-6"}>
      {!docsAndFiles && <h2 className="text-xl font-semibold tracking-tight mb-4">Docs & Files</h2>}

      <ContentListState name="docs-and-files" loading={loading} error={error} onRetry={onRetry}>
        {docsAndFiles && (
          <NewFileModalsProvider value={docsAndFiles.newFileModals}>
            <PageDocsAndFilesTabContent
              docsAndFiles={docsAndFiles}
              formattedTimePreferences={formattedTimePreferences}
            />
          </NewFileModalsProvider>
        )}
      </ContentListState>
    </div>
  );
}

function PageDocsAndFilesTabContent({
  docsAndFiles,
  formattedTimePreferences,
}: {
  docsAndFiles: PageDocsAndFiles;
  formattedTimePreferences: FormattedTimePreferences;
}) {
  const { filesSelected, navigateToNewDocument, navigateToNewLink, selectFiles, toggleShowAddFolder } =
    useNewFileModalsContext();
  const searchState = useResourceHubSearch(docsAndFiles.search);
  const displayedNodes = searchState.isActive ? searchState.results : docsAndFiles.nodesListProps.nodes;
  const items = React.useMemo(
    () => displayedNodes.flatMap((node) => mapNodeToItem(node, docsAndFiles)),
    [displayedNodes, docsAndFiles],
  );
  const draftPrompt = React.useMemo(() => buildDraftPrompt(docsAndFiles), [docsAndFiles]);
  return (
    <ResourceHubNodesListProvider value={docsAndFiles.nodesListProps.listContext}>
      <FileDragAndDropArea onFilesDropped={docsAndFiles.newFileModals.setFiles}>
        <DocsAndFilesTab
          title={docsAndFiles.resourceHub.name ?? "Documents & Files"}
          items={items}
          draftPrompt={draftPrompt}
          emptyStateKind="resourceHub"
          hideEmptyState={filesSelected}
          search={docsAndFiles.search ? { configuration: docsAndFiles.search, state: searchState } : undefined}
          toolbar={
            docsAndFiles.search && <ResourceHubSearchInput search={docsAndFiles.search} searchState={searchState} />
          }
          actions={
            <AddFilesButton
              permissions={docsAndFiles.resourceHub.permissions}
              onNewDocument={navigateToNewDocument}
              onNewFolder={toggleShowAddFolder}
              onUploadFiles={selectFiles}
              onNewLink={navigateToNewLink}
            />
          }
          beforeItems={<AddFileWidget {...docsAndFiles.addFileWidgetProps} />}
          formattedTimePreferences={formattedTimePreferences}
        />
        <AddFolderModal {...docsAndFiles.addFolderModalProps} />
      </FileDragAndDropArea>
    </ResourceHubNodesListProvider>
  );
}

function buildDraftPrompt(docsAndFiles: PageDocsAndFiles): DocsAndFiles.DraftPrompt {
  return { count: docsAndFiles.drafts.nodes.length, link: docsAndFiles.drafts.draftsPath };
}

function mapNodeToItem(node: ResourceHubNode, docsAndFiles: PageDocsAndFiles): DocsAndFiles.Item[] {
  const type = getNodeType(node);

  if (!type) return [];

  return [
    {
      id: getNodeId(node) ?? docsAndFiles.nodesListProps.getNodePath(node),
      name: getNodeName(node),
      type,
      link: docsAndFiles.nodesListProps.getNodePath(node),
      insertedAt: nodeDisplayInsertedAt(node),
      updatedAt: node.updatedAt,
      commentsCount: getNodeCommentsCount(node),
      author: getNodeAuthor(node),
      details: buildNodeDetails(node, docsAndFiles),
      fileKind: buildFileKind(node),
      fileTypeLabel: buildFileTypeLabel(node),
      thumbnail: buildThumbnail(node),
      menu: <NodeMenu node={node} />,
    },
  ];
}

function buildNodeDetails(node: ResourceHubNode, docsAndFiles: PageDocsAndFiles): string[] {
  if (getNodeType(node) === "folder") {
    const childrenCount = getNodeChildrenCount(node);

    if (childrenCount === null) return [];

    return [plurarize(childrenCount, "item", "items")];
  }

  return [buildFileSize(node, docsAndFiles), buildContentSnippet(node)].filter((detail): detail is string =>
    Boolean(detail),
  );
}

function buildFileSize(node: ResourceHubNode, docsAndFiles: PageDocsAndFiles) {
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
