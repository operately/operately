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
  addFileWidgetProps: Pick<
    AddFileWidgetProps,
    "forms" | "modal" | "subscriptions" | "mentionSearchScope" | "formatFileSize" | "onUpload"
  >;
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

interface SharedResourceHubListPageProps extends SharedListPageProps {
  heading: string;
  permissions?: ResourceHubPermissions | null;
  options?: Page.Option[];
  beforeList?: React.ReactNode;
  children?: React.ReactNode;
}

export function SharedListPage({
  title,
  navigation,
  newFileModals,
  addFileWidgetProps,
  nodesListProps,
  addFolderModalProps,
  heading,
  permissions,
  options,
  beforeList,
  children,
}: SharedResourceHubListPageProps) {
  return (
    <NewFileModalsProvider value={newFileModals}>
      <FileDragAndDropArea onFilesDropped={newFileModals.setFiles}>
        <Page title={title} size="large" navigation={navigation} options={options}>
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
        </Page>

        {children}
      </FileDragAndDropArea>
    </NewFileModalsProvider>
  );
}
