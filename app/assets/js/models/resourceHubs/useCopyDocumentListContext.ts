import { useMemo } from "react";
import { useNavigate } from "react-router";

import * as Hub from "@/models/resourceHubs";
import { useSubscriptionsAdapter } from "@/models/subscriptions";
import { compareIds, usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { sortNodesWithFoldersFirst, type FolderSelectLoadResult, type ResourceHubNodesListContextValue } from "turboui";

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
      folderSelect: {
        loadFolder: async (id: string): Promise<FolderSelectLoadResult> => {
          const res = await Hub.folders.get({
            id,
            includeNodes: true,
            includePathToFolder: true,
            includeResourceHub: true,
            includeGoal: true,
            includeSpace: true,
            includeProject: true,
          });

          return {
            current: { type: "folder", folder: res.folder! },
            nodes: sortNodesWithFoldersFirst(res.folder!.nodes || []),
          };
        },
        loadResourceHub: async (id: string): Promise<FolderSelectLoadResult> => {
          const res = await Hub.resource_hubs.get({ id, includeNodes: true, includeGoal: true, includeSpace: true, includeProject: true });

          return {
            current: { type: "resourceHub", resourceHub: res.resourceHub! },
            nodes: sortNodesWithFoldersFirst(res.resourceHub!.nodes || []),
          };
        },
        compareIds,
      },
    }),
    [parent, resource.resourceHubId, paths, createDocument, subscriptionsState.currentSubscribersList, navigate],
  );
}
