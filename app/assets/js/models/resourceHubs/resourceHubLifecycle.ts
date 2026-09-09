import Api from "@/api";
import { type QueryClient, type UseMutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";

async function invalidateResourceHubQueries(client: QueryClient) {
  await Promise.all(
    [
      Api.resource_hubs.getQueryKeyPrefix(),
      Api.resource_hubs.listNodesQueryKeyPrefix(),
      Api.resource_hubs.getFolderQueryKeyPrefix(),
      Api.documents.getQueryKeyPrefix(),
      Api.files.getQueryKeyPrefix(),
      Api.links.getQueryKeyPrefix(),
    ].map((queryKey) => client.invalidateQueries({ queryKey })),
  );
}

function useResourceHubMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const client = useQueryClient();
  return useMutation({
    ...options,
    onSuccess: (data) => {
      if (data && typeof data === "object" && "success" in data && data.success === false) return;
      void invalidateResourceHubQueries(client);
    },
  });
}

export function useCreateDocument() {
  return useResourceHubMutation(Api.documents.createMutationOptions());
}

export function useUpdateDocument() {
  return useResourceHubMutation(Api.documents.updateMutationOptions());
}

export function usePublishDocument() {
  return useResourceHubMutation(Api.documents.publishMutationOptions());
}

export function useDeleteDocument() {
  return useResourceHubMutation(Api.documents.deleteMutationOptions());
}

export function useCreateFiles() {
  return useResourceHubMutation(Api.files.createMutationOptions());
}

export function useUpdateFile() {
  return useResourceHubMutation(Api.files.updateMutationOptions());
}

export function useDeleteFile() {
  return useResourceHubMutation(Api.files.deleteMutationOptions());
}

export function useCreateLink() {
  return useResourceHubMutation(Api.links.createMutationOptions());
}

export function useUpdateLink() {
  return useResourceHubMutation(Api.links.updateMutationOptions());
}

export function useDeleteLink() {
  return useResourceHubMutation(Api.links.deleteMutationOptions());
}

export function useCreateFolder() {
  return useResourceHubMutation(Api.resource_hubs.createFolderMutationOptions());
}

export function useRenameFolder() {
  return useResourceHubMutation(Api.resource_hubs.renameFolderMutationOptions());
}

export function useDeleteFolder() {
  return useResourceHubMutation(Api.resource_hubs.deleteFolderMutationOptions());
}

export function useCopyFolder() {
  return useResourceHubMutation(Api.resource_hubs.copyFolderMutationOptions());
}

export function useMoveResource() {
  return useResourceHubMutation(Api.resource_hubs.updateParentFolderMutationOptions());
}
