import { useCreateDocument } from "./resourceHubLifecycle";
import { useMemo } from "react";
import Api from "@/api";
import { useNavigate } from "react-router";

import * as Hub from "@/models/resourceHubs";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds, usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { sortNodesWithFoldersFirst, type FolderSelectLoadResult, type ResourceHubNodesListContextValue } from "turboui";

export function useCopyDocumentListContext(
  parent: Hub.ResourceHub | Hub.ResourceHubFolder,
  resource: Hub.ResourceHubDocument,
): ResourceHubNodesListContextValue {
  const paths = usePaths();
  const navigate = useNavigate();
  const { mutateAsync: createDocument } = useCreateDocument();

  const me = useMe();
  const isFolder = Boolean(resource.parentFolderId && compareIds(parent.id, resource.parentFolderId));

  return useMemo(
    () => ({
      parent: {
        id: parent.id,
        name: parent.name || "",
        type: isFolder ? "folder" : "resource_hub",
        resourceHubId: resource.resourceHubId,
      },
      actions: {
        copyDocument: async (args) => {
          assertPresent(args.content, "content must be present in document");

          // Recipients are only needed when submitting the copy, not when opening a document.
          const { resourceHub } = await Api.resource_hubs.getQuery({
            id: resource.resourceHubId,
            includePotentialSubscribers: true,
          });
          assertPresent(resourceHub?.potentialSubscribers, "Copy recipients are unavailable");
          const subscriberIds = resourceHub.potentialSubscribers.flatMap(({ person }) =>
            person && !compareIds(person.id, me?.id) ? [person.id] : [],
          );

          const res = await createDocument({
            resourceHubId: resource.resourceHubId,
            folderId: args.location.type === "folder" ? args.location.id || undefined : undefined,
            name: args.name,
            content: args.content,
            sendNotificationsToEveryone: true,
            subscriberIds,
            copiedDocumentId: args.documentId,
          });

          const document: unknown = res.document;
          if (!document || typeof document !== "object" || !("id" in document) || typeof document.id !== "string") {
            throw new Error("Created document is missing its id");
          }
          navigate(paths.resourceHubDocumentPath(document.id));
        },
      },
      folderSelect: {
        loadFolder: async (id: string): Promise<FolderSelectLoadResult> => {
          const res = await Api.resource_hubs.getFolderQuery({
            id,
            includeNodes: true,
            includePathToFolder: true,
            includeResourceHub: true,
            includeGoal: true,
            includeSpace: true,
            includeProject: true,
          });

          assertPresent(res.folder, "Copy destination folder is unavailable");
          return {
            current: { type: "folder", folder: res.folder },
            nodes: sortNodesWithFoldersFirst(res.folder.nodes ?? []),
          };
        },
        loadResourceHub: async (id: string): Promise<FolderSelectLoadResult> => {
          const res = await Api.resource_hubs.getQuery({
            id,
            includeNodes: true,
            includeGoal: true,
            includeSpace: true,
            includeProject: true,
          });

          assertPresent(res.resourceHub, "Copy destination resource hub is unavailable");
          return {
            current: { type: "resourceHub", resourceHub: res.resourceHub },
            nodes: sortNodesWithFoldersFirst(res.resourceHub.nodes ?? []),
          };
        },
        compareIds,
      },
    }),
    [parent, isFolder, resource.resourceHubId, paths, createDocument, me?.id, navigate],
  );
}
