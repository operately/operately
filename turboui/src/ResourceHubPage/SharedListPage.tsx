import * as React from "react";

import { Page } from "../Page";
import {
  AddFileWidget,
  AddFilesButton,
  AddFolderModal,
  FileDragAndDropArea,
  Header as ResourceHubHeader,
  NewFileModalsProvider,
  NodesList,
  type AddFileWidgetProps,
  type AddFolderModalProps,
  type NewFileModalsContextValue,
  type ResourceHubNode,
  type ResourceHubNodesListContextValue,
  type ResourceHubPermissions,
  type ResourceHubSortBy,
} from "../ResourceHub";

export interface SharedListPageProps {
  title: Page.Props["title"];
  navigation: NonNullable<Page.Props["navigation"]>;
  newFileModals: NewFileModalsContextValue;
  addFileWidgetProps: Pick<AddFileWidgetProps, "subscriptions" | "richTextHandlers" | "formatFileSize" | "onUpload">;
  nodesListProps: {
    nodes: ResourceHubNode[];
    getNodePath: (node: ResourceHubNode) => string;
    sortBy: ResourceHubSortBy;
    onSortChange: (sortBy: ResourceHubSortBy) => void;
    emptyVariant: "hub" | "folder";
    listContext: ResourceHubNodesListContextValue;
    getNodeTestId?: (node: ResourceHubNode, index: number) => string;
  };
  addFolderModalProps: AddFolderModalProps;
}

export interface SharedListContentProps extends Omit<SharedListPageProps, "title" | "navigation"> {
  heading: string;
  permissions?: ResourceHubPermissions | null;
  beforeList?: React.ReactNode;
}

interface SharedResourceHubListPageProps extends SharedListPageProps, SharedListContentProps {
  options?: Page.Option[];
  children?: React.ReactNode;
}

export function SharedListContent({
  newFileModals,
  addFileWidgetProps,
  nodesListProps,
  addFolderModalProps,
  heading,
  permissions,
  beforeList,
}: SharedListContentProps) {
  return (
    <div className="min-h-[75vh] px-4 sm:px-12 py-10">
      <ResourceHubHeader
        title={heading}
        actions={
          <AddFilesButton
            permissions={permissions}
            onNewDocument={newFileModals.navigateToNewDocument}
            onNewFolder={newFileModals.toggleShowAddFolder}
            onUploadFiles={newFileModals.selectFiles}
            onNewLink={newFileModals.navigateToNewLink}
          />
        }
      />

      {beforeList}
      <AddFileWidget {...addFileWidgetProps} />
      <NodesList {...nodesListProps} />
      <AddFolderModal {...addFolderModalProps} />
    </div>
  );
}

export function SharedListPage({ title, navigation, options, children, ...contentProps }: SharedResourceHubListPageProps) {
  return (
    <NewFileModalsProvider value={contentProps.newFileModals}>
      <FileDragAndDropArea onFilesDropped={contentProps.newFileModals.setFiles}>
        <Page title={title} size="large" navigation={navigation} options={options}>
          <SharedListContent {...contentProps} />
        </Page>

        {children}
      </FileDragAndDropArea>
    </NewFileModalsProvider>
  );
}
