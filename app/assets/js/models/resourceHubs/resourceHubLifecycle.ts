import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { invalidateSpaceSummaryQueries } from "@/models/spaces/spaceSummaryQueries";
import { type QueryClient, type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

interface ResourceHubScope {
  spaceId?: string | null;
  resourceHubId?: string | null;
  parentFolderId?: string | null;
}

// IDs already supplied by the resource-hub mutation endpoints.
interface ResourceHubMutationInput {
  // Deleted details stay stale until navigation; requesting them now would return a 404.
  deleted?: boolean;
  resourceHubId?: string | null;
  documentId?: string | null;
  fileId?: string | null;
  linkId?: string | null;
  folderId?: string | null;
  newFolderId?: string | null;
  destParentFolderId?: string | null;
  resourceId?: string | null;
  resourceType?: string;
}

export async function invalidateResourceHubQueries(
  client: QueryClient,
  input: ResourceHubMutationInput,
  scope: ResourceHubScope = {},
  refetchType: "active" | "none" = "active",
) {
  const hubId = input.resourceHubId ?? scope.resourceHubId;
  const folderIds = [scope.parentFolderId, input.folderId, input.newFolderId, input.destParentFolderId];
  const documentId = input.documentId ?? (input.resourceType === "document" ? input.resourceId : undefined);
  const fileId = input.fileId ?? (input.resourceType === "file" ? input.resourceId : undefined);
  const linkId = input.linkId ?? (input.resourceType === "link" ? input.resourceId : undefined);

  if (input.resourceType === "folder") folderIds.push(input.resourceId);

  // Match every include-flag and URL-name variant, without affecting other resources.
  const invalidate = (prefix: readonly unknown[], field: string, ids: (string | null | undefined)[], detail = false) => {
    if (!ids.some(Boolean)) return Promise.resolve();

    return client.invalidateQueries({
      queryKey: prefix,
      refetchType: detail && input.deleted ? "none" : refetchType,
      predicate: (query) => {
        const queryInput = query.queryKey[prefix.length] as Record<string, string | undefined> | undefined;
        return ids.some((id) => compareIds(queryInput?.[field], id));
      },
    });
  };
  const nodesPrefix = Api.resource_hubs.listNodesQueryKeyPrefix();

  await Promise.all([
    invalidate(Api.resource_hubs.getQueryKeyPrefix(), "id", [hubId]),
    invalidate(Api.resource_hubs.listDraftsQueryKeyPrefix(), "resourceHubId", [hubId]),
    client.invalidateQueries({
      queryKey: nodesPrefix,
      refetchType,
      predicate: (query) => {
        const queryInput = query.queryKey[nodesPrefix.length] as
          | { resourceHubId?: string; folderId?: string }
          | undefined;
        return (
          compareIds(queryInput?.resourceHubId, hubId) || folderIds.some((id) => compareIds(queryInput?.folderId, id))
        );
      },
    }),
    invalidate(Api.resource_hubs.getFolderQueryKeyPrefix(), "id", folderIds),
    invalidate(Api.documents.getQueryKeyPrefix(), "id", [documentId], true),
    invalidate(Api.documents.listVersionsQueryKeyPrefix(), "documentId", [documentId], true),
    invalidate(Api.files.getQueryKeyPrefix(), "id", [fileId], true),
    invalidate(Api.links.getQueryKeyPrefix(), "id", [linkId], true),
  ]);
}

function useResourceHubMutation<TData, TError, TVariables extends ResourceHubMutationInput>(
  options: UseMutationOptions<TData, TError, TVariables>,
  scope: ResourceHubScope = {},
  deleted = false,
) {
  const client = useQueryClient();

  return useMutation<TData, TError, TVariables, ResourceHubScope>({
    ...options,
    // Keep the original parent IDs if the user navigates while the mutation is pending.
    onMutate: () => ({ ...scope }),
    onSuccess: async (data, input, context) => {
      if (data === false || (data && typeof data === "object" && "success" in data && data.success === false)) return;

      await Promise.all([
        invalidateResourceHubQueries(client, { ...input, deleted }, context),
        context?.spaceId ? invalidateSpaceSummaryQueries(client, [context.spaceId]) : undefined,
      ]).catch((error) => {
        console.error("Failed to refresh resource hub queries", error);
      });
    },
  });
}

export function useCreateDocument(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.documents.createMutationOptions(), scope);
}

export function useUpdateDocument(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.documents.updateMutationOptions(), scope);
}

export function usePublishDocument(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.documents.publishMutationOptions(), scope);
}

export function useDeleteDocument(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.documents.deleteMutationOptions(), scope, true);
}

export function useCreateFiles(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.files.createMutationOptions(), scope);
}

export function useUpdateFile(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.files.updateMutationOptions(), scope);
}

export function useDeleteFile(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.files.deleteMutationOptions(), scope, true);
}

export function useCreateLink(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.links.createMutationOptions(), scope);
}

export function useUpdateLink(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.links.updateMutationOptions(), scope);
}

export function useDeleteLink(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.links.deleteMutationOptions(), scope, true);
}

export function useCreateFolder(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.resource_hubs.createFolderMutationOptions(), scope);
}

export function useRenameFolder(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.resource_hubs.renameFolderMutationOptions(), scope);
}

export function useDeleteFolder(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.resource_hubs.deleteFolderMutationOptions(), scope);
}

export function useCopyFolder(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.resource_hubs.copyFolderMutationOptions(), scope);
}

export function useMoveResource(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.resource_hubs.updateParentFolderMutationOptions(), scope);
}

export function useRestoreDocumentVersion(scope: ResourceHubScope = {}) {
  return useResourceHubMutation(Api.documents.restoreVersionMutationOptions(), scope);
}
