import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import * as Hub from "@/models/resourceHubs";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { compareIds, usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { downloadMarkdown, exportToMarkdown } from "@/utils/markdown";
import { sortNodesWithFoldersFirst, type FolderSelectLoadResult, type ResourceHubNodesListContextValue } from "turboui";

import { resourceHubListPaths } from "./paths";

interface ResourceHubProps {
  resourceHub: Hub.ResourceHub;
  type: "resource_hub";
  nodes: Hub.ResourceHubNode[];
  refetch: () => void;
}

interface FolderProps {
  folder: Hub.ResourceHubFolder;
  type: "folder";
  nodes: Hub.ResourceHubNode[];
  refetch: () => void;
}

export type NodesProps = ResourceHubProps | FolderProps;

async function downloadFile(fileUrl: string, fileName: string) {
  const res = await fetch(fileUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function useResourceHubNodesListContext(props: NodesProps): ResourceHubNodesListContextValue {
  const paths = usePaths();
  const navigate = useNavigate();
  const parent = props.type === "resource_hub" ? props.resourceHub : props.folder;

  assertPresent(parent.permissions, `permissions must be present in ${props.type}`);
  assertPresent(parent.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");

  const [deleteDocument] = Hub.documents.useDelete();
  const [deleteFile] = Hub.files.useDelete();
  const [deleteFolder] = Hub.folders.useDelete();
  const [deleteLink] = Hub.links.useDelete();
  const [renameFolder] = Hub.folders.useRename();
  const [moveResource] = Hub.resource_hubs.useUpdateParentFolder();
  const [createDocument] = Hub.documents.useCreate();
  const [copyFolder] = Hub.folders.useCopy();

  const subscriptionsState = useSubscriptionsAdapter(parent.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: parent.name || "",
  });

  return useMemo(() => {
    const folderSelect: ResourceHubNodesListContextValue["folderSelect"] = {
      loadFolder: async (id: string): Promise<FolderSelectLoadResult> => {
        const res = await Hub.folders.get({
          id,
          includeNodes: true,
          includePathToFolder: true,
          includeResourceHub: true,
        });

        return {
          current: { type: "folder", folder: res.folder! },
          nodes: sortNodesWithFoldersFirst(res.folder!.nodes || []),
        };
      },
      loadResourceHub: async (id: string): Promise<FolderSelectLoadResult> => {
        const res = await Hub.resource_hubs.get({ id, includeNodes: true, includeSpace: true });

        return {
          current: { type: "resourceHub", resourceHub: res.resourceHub! },
          nodes: sortNodesWithFoldersFirst(res.resourceHub!.nodes || []),
        };
      },
      compareIds,
    };

    return {
      permissions: parent.permissions,
      parent: {
        id: parent.id!,
        name: parent.name || "",
        type: props.type === "resource_hub" ? "resource_hub" : "folder",
        resourceHubId: props.type === "folder" ? props.folder.resourceHubId : parent.id,
      },
      onRefetch: props.refetch,
      paths: resourceHubListPaths(paths),
      actions: {
        deleteDocument: async (id: string) => {
          await deleteDocument({ documentId: id });
        },
        deleteFile: async (id: string) => {
          await deleteFile({ fileId: id });
        },
        deleteFolder: async (id: string) => {
          await deleteFolder({ folderId: id });
        },
        deleteLink: async (id: string) => {
          await deleteLink({ linkId: id });
        },
        renameFolder: async (id: string, name: string) => {
          await renameFolder({ folderId: id, newName: name });
        },
        moveResource: async (args) => {
          await moveResource({
            newFolderId: args.newFolderId,
            resourceId: args.resourceId,
            resourceType: args.resourceType,
          });
        },
        copyDocument: async (args) => {
          assertPresent(args.resourceHubId, "resourceHubId must be present in document");
          assertPresent(args.content, "content must be present in document");

          const res = await createDocument({
            resourceHubId: args.resourceHubId,
            folderId: args.location.type === "folder" ? args.location.id || undefined : undefined,
            name: args.name,
            content: args.content,
            sendNotificationsToEveryone: true,
            subscriberIds: subscriptionsState.currentSubscribersList,
            copiedDocumentId: args.documentId,
          });

          navigate(paths.resourceHubDocumentPath(res.document.id));
        },
        copyFolder: async (args) => {
          assertPresent(args.resourceHubId, "resourceHubId must be present in folder");

          const res = await copyFolder({
            folderName: args.name,
            folderId: args.folderId,
            destResourceHubId: args.resourceHubId,
            destParentFolderId: args.location.type === "folder" ? args.location.id || undefined : undefined,
          });

          navigate(paths.resourceHubFolderPath(res.folderId));
        },
        downloadFile: (url: string, name: string) => {
          void downloadFile(url, name);
        },
        exportDocumentMarkdown: (content: string, name: string) => {
          const parsedContent = JSON.parse(content);
          const markdown = exportToMarkdown(parsedContent, { removeEmbeds: true });
          downloadMarkdown(markdown, name);
        },
      },
      forms: Forms as unknown as ResourceHubNodesListContextValue["forms"],
      modal: { Modal },
      folderSelect,
    };
  }, [
    parent,
    props,
    paths,
    deleteDocument,
    deleteFile,
    deleteFolder,
    deleteLink,
    renameFolder,
    moveResource,
    createDocument,
    copyFolder,
    subscriptionsState.currentSubscribersList,
    navigate,
  ]);
}
