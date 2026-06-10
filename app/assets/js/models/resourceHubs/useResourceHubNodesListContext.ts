import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import * as Hub from "@/models/resourceHubs";
import { nodeToUiNode } from "@/models/resourceHubs";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { assertPresent } from "@/utils/assertions";
import { downloadMarkdown, exportToMarkdown } from "@/utils/markdown";
import { compareIds, usePaths } from "@/routes/paths";
import type {
  FolderSelectLoadNode,
  FolderSelectLoadResult,
  ResourceHubNodesListContextValue,
  ResourceHubNotAllowedSelection,
} from "turboui";
import { sortNodesWithFoldersFirst } from "turboui";

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

function selectionAllowed(
  resourceType: Hub.ResourceTypeName,
  resource: Hub.Resource,
  preventSelection?: ResourceHubNotAllowedSelection[],
): boolean {
  return resourceType === "folder" && !preventSelection?.some((loc) => loc.id === resource.id);
}

function findResource(node: Hub.ResourceHubNode): Hub.Resource {
  return match(node.type)
    .with("folder", () => node.folder!)
    .with("file", () => node.file!)
    .with("document", () => node.document!)
    .with("link", () => node.link!)
    .run();
}

function apiFolderToNodeParent(
  folder: Hub.ResourceHubFolder,
  preventSelection?: ResourceHubNotAllowedSelection[],
): FolderSelectLoadNode {
  if (folder.pathToFolder && folder.pathToFolder.length > 0) {
    const parent = folder.pathToFolder.slice(-1)[0]!;

    return {
      id: parent.id!,
      selectable: selectionAllowed("folder", parent, preventSelection),
      name: parent.name!,
      type: "folder",
      resource: parent,
    };
  }

  return {
    id: folder.resourceHub!.id!,
    selectable: true,
    name: folder.resourceHub!.name!,
    type: "resourceHub",
    resource: folder.resourceHub!,
  };
}

function apiFolderToNode(
  folder: Hub.ResourceHubFolder,
  preventSelection?: ResourceHubNotAllowedSelection[],
): FolderSelectLoadNode {
  return {
    id: folder.id!,
    selectable: selectionAllowed("folder", folder, preventSelection),
    name: folder.name!,
    type: "folder",
    resource: folder,
    parent: apiFolderToNodeParent(folder, preventSelection),
  };
}

function apiResourceHubToNode(resourceHub: Hub.ResourceHub): FolderSelectLoadNode {
  return {
    id: resourceHub.id!,
    selectable: true,
    name: resourceHub.name!,
    type: "resourceHub",
    resource: resourceHub,
  };
}

function apiNodesToFolderSelectNodes(
  nodes: Hub.ResourceHubNode[],
  preventSelection?: ResourceHubNotAllowedSelection[],
): FolderSelectLoadNode[] {
  return sortNodesWithFoldersFirst(nodes).map((node) => {
    const resource = findResource(node);

    return {
      id: node.id!,
      selectable: selectionAllowed(node.type! as Hub.ResourceTypeName, resource, preventSelection),
      name: node.name!,
      type: "folder",
      resource,
      apiNode: node,
    };
  });
}

export function useResourceHubNodesListContext(props: NodesProps): ResourceHubNodesListContextValue {
  const paths = usePaths();
  const navigate = useNavigate();
  const parent = props.type === "resource_hub" ? props.resourceHub : props.folder;

  assertPresent(parent.permissions, `permissions must be present in ${props.type}`);

  const [deleteDocument] = Hub.documents.useDelete();
  const [deleteFile] = Hub.files.useDelete();
  const [deleteFolder] = Hub.folders.useDelete();
  const [deleteLink] = Hub.links.useDelete();
  const [renameFolder] = Hub.folders.useRename();
  const [moveResource] = Hub.resource_hubs.useUpdateParentFolder();
  const [createDocument] = Hub.documents.useCreate();
  const [copyFolder] = Hub.folders.useCopy();

  assertPresent(parent.potentialSubscribers, "potentialSubscribers must be present in resourceHub or folder");

  const subscriptionsState = useSubscriptionsAdapter(parent.potentialSubscribers, {
    ignoreMe: true,
    resourceHubName: parent.name || "",
  });

  return useMemo(() => {
    const permissions = {
      canCreateDocument: Boolean(parent.permissions!.canCreateDocument),
      canCreateFile: Boolean(parent.permissions!.canCreateFile),
      canCreateFolder: Boolean(parent.permissions!.canCreateFolder),
      canCreateLink: Boolean(parent.permissions!.canCreateLink),
      canView: Boolean(parent.permissions!.canView),
      canEditDocument: Boolean(parent.permissions!.canEditDocument),
      canEditFile: Boolean(parent.permissions!.canEditFile),
      canEditLink: Boolean(parent.permissions!.canEditLink),
      canEditParentFolder: Boolean(parent.permissions!.canEditParentFolder),
      canDeleteDocument: Boolean(parent.permissions!.canDeleteDocument),
      canDeleteFile: Boolean(parent.permissions!.canDeleteFile),
      canDeleteFolder: Boolean(parent.permissions!.canDeleteFolder),
      canDeleteLink: Boolean(parent.permissions!.canDeleteLink),
      canRenameFolder: Boolean(parent.permissions!.canRenameFolder),
      canCopyFolder: Boolean(parent.permissions!.canCopyFolder),
    };

    const folderSelect: ResourceHubNodesListContextValue["folderSelect"] = {
      loadFolder: async (id: string): Promise<FolderSelectLoadResult> => {
        const res = await Hub.folders.get({
          id,
          includeNodes: true,
          includePathToFolder: true,
          includeResourceHub: true,
        });

        return {
          currentNode: apiFolderToNode(res.folder!),
          nodes: apiNodesToFolderSelectNodes(res.folder!.nodes!),
        };
      },
      loadResourceHub: async (id: string): Promise<FolderSelectLoadResult> => {
        const res = await Hub.resource_hubs.get({ id, includeNodes: true });

        return {
          currentNode: apiResourceHubToNode(res.resourceHub!),
          nodes: apiNodesToFolderSelectNodes(res.resourceHub!.nodes!),
        };
      },
      mapApiNodeToUiNode: (apiNode: unknown) => nodeToUiNode(paths, apiNode as Hub.ResourceHubNode),
      compareIds,
    };

    return {
      permissions,
      parent: {
        id: parent.id!,
        name: parent.name || "",
        type: props.type === "resource_hub" ? "resource_hub" : "folder",
        resourceHubId: props.type === "folder" ? (parent as Hub.ResourceHubFolder).resourceHubId : parent.id,
      },
      onRefetch: props.refetch,
      paths: {
        editDocumentPath: paths.resourceHubEditDocumentPath,
        editFilePath: paths.resourceHubEditFilePath,
        editLinkPath: paths.resourceHubEditLinkPath,
        documentPath: paths.resourceHubDocumentPath,
        folderPath: paths.resourceHubFolderPath,
      },
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
    props.type,
    props.refetch,
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
