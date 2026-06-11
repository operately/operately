import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Modal from "@/components/Modal";
import Forms from "@/components/Forms";
import * as Hub from "@/models/resourceHubs";
import { nodeToUiNode } from "@/models/resourceHubs";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { assertPresent } from "@/utils/assertions";
import { compareIds, usePaths } from "@/routes/paths";
import type { FolderSelectLoadResult, ResourceHubNodesListContextValue } from "turboui";
import { sortNodesWithFoldersFirst } from "turboui";
import { match } from "ts-pattern";

export function useCopyDocumentListContext(
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
      parent: {
        id: parent.id!,
        name: parent.name || "",
        type: "pathToFolder" in parent ? "folder" : "resource_hub",
        resourceHubId: "pathToFolder" in parent ? parent.resourceHubId : parent.id,
      },
      actions: {
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
      },
      forms: Forms as unknown as ResourceHubNodesListContextValue["forms"],
      modal: { Modal },
      folderSelect: {
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
      },
    }),
    [parent, resource.resourceHubId, paths, createDocument, subscriptionsState.currentSubscribersList, navigate],
  );
}

function findResource(node: Hub.ResourceHubNode): Hub.Resource {
  return match(node.type)
    .with("folder", () => node.folder!)
    .with("file", () => node.file!)
    .with("document", () => node.document!)
    .with("link", () => node.link!)
    .run();
}

function apiFolderToNodeParent(folder: Hub.ResourceHubFolder) {
  if (folder.pathToFolder && folder.pathToFolder.length > 0) {
    const parent = folder.pathToFolder.slice(-1)[0]!;

    return {
      id: parent.id!,
      selectable: true,
      name: parent.name!,
      type: "folder" as const,
      resource: parent,
    };
  }

  return {
    id: folder.resourceHub!.id!,
    selectable: true,
    name: folder.resourceHub!.name!,
    type: "resourceHub" as const,
    resource: folder.resourceHub!,
  };
}

function apiFolderToNode(folder: Hub.ResourceHubFolder) {
  return {
    id: folder.id!,
    selectable: true,
    name: folder.name!,
    type: "folder" as const,
    resource: folder,
    parent: apiFolderToNodeParent(folder),
  };
}

function apiResourceHubToNode(resourceHub: Hub.ResourceHub) {
  return {
    id: resourceHub.id!,
    selectable: true,
    name: resourceHub.name!,
    type: "resourceHub" as const,
    resource: resourceHub,
  };
}

function apiNodesToFolderSelectNodes(nodes: Hub.ResourceHubNode[]) {
  return sortNodesWithFoldersFirst(nodes).map((node) => {
    const resource = findResource(node);

    return {
      id: node.id!,
      selectable: node.type === "folder",
      name: node.name!,
      type: "folder" as const,
      resource,
      apiNode: node,
    };
  });
}
