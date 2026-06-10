import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import * as Hub from "@/models/resourceHubs";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { assertPresent } from "@/utils/assertions";
import { usePaths } from "@/routes/paths";
import {
  CopyDocumentModal as TurboCopyDocumentModal,
  ResourceHubDocumentMenuData,
  ResourceHubNodesListProvider,
  type ResourceHubNodesListContextValue,
} from "turboui";

import { FolderSelectField } from "./FolderSelectField";

interface CopyDocumentModalProps {
  resource: Hub.ResourceHubDocument;
  isOpen: boolean;
  hideModal: () => void;
  parent: Hub.ResourceHub | Hub.ResourceHubFolder;
}

export function CopyDocumentModal({ resource, isOpen, hideModal, parent }: CopyDocumentModalProps) {
  const listContext = useCopyDocumentListContext(parent, resource);

  const menuResource: ResourceHubDocumentMenuData = {
    type: "document",
    id: resource.id!,
    name: resource.name || "",
    content: resource.content,
    parentFolderId: resource.parentFolderId,
    resourceHubId: resource.resourceHubId,
  };

  return (
    <ResourceHubNodesListProvider value={listContext}>
      <TurboCopyDocumentModal resource={menuResource} isOpen={isOpen} hideModal={hideModal} />
    </ResourceHubNodesListProvider>
  );
}

function useCopyDocumentListContext(
  parent: Hub.ResourceHub | Hub.ResourceHubFolder,
  resource: Hub.ResourceHubDocument,
): ResourceHubNodesListContextValue {
  const paths = usePaths();
  const navigate = useNavigate();
  const [createDocument] = Hub.documents.useCreate();

  assertPresent(parent.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");

  const subscriptionsState = useSubscriptionsAdapter(parent.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: parent.name || "",
  });

  return useMemo(
    () => ({
      permissions: {
        canCreateDocument: true,
        canCreateFile: false,
        canCreateFolder: false,
        canCreateLink: false,
        canView: false,
        canEditDocument: false,
        canEditFile: false,
        canEditLink: false,
        canEditParentFolder: false,
        canDeleteDocument: false,
        canDeleteFile: false,
        canDeleteFolder: false,
        canDeleteLink: false,
        canRenameFolder: false,
        canCopyFolder: false,
      },
      parent: {
        id: parent.id!,
        name: parent.name || "",
        type: "pathToFolder" in parent ? "folder" : "resource_hub",
        resourceHubId: "pathToFolder" in parent ? parent.resourceHubId : parent.id,
      },
      onRefetch: () => {},
      paths: {
        editDocumentPath: paths.resourceHubEditDocumentPath,
        editFilePath: paths.resourceHubEditFilePath,
        editLinkPath: paths.resourceHubEditLinkPath,
        documentPath: paths.resourceHubDocumentPath,
        folderPath: paths.resourceHubFolderPath,
      },
      actions: {
        deleteDocument: async () => {},
        deleteFile: async () => {},
        deleteFolder: async () => {},
        deleteLink: async () => {},
        renameFolder: async () => {},
        moveResource: async () => {},
        copyDocument: async (args) => {
          assertPresent(resource.resourceHubId, "resourceHubId must be present in resource");
          assertPresent(args.content, "content must be present in document");

          const res = await createDocument({
            resourceHubId: resource.resourceHubId,
            folderId: args.location.type === "folder" ? args.location.id || undefined : undefined,
            name: args.name,
            content: args.content,
            sendNotificationsToEveryone: true,
            subscriberIds: subscriptionsState.currentSubscribersList,
            copiedDocumentId: args.documentId,
          });

          navigate(paths.resourceHubDocumentPath(res.document.id));
        },
        copyFolder: async () => {},
        downloadFile: () => {},
        exportDocumentMarkdown: () => {},
      },
      forms: Forms as unknown as ResourceHubNodesListContextValue["forms"],
      modal: { Modal },
      components: {
        FolderSelectField,
      },
    }),
    [parent, resource.resourceHubId, paths, createDocument, subscriptionsState.currentSubscribersList, navigate],
  );
}
