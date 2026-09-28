import { useMutation, useQueryClient } from "@tanstack/react-query";
import Api from "@/api";

export function useUpdateDocumentPublicSharing() {
  const client = useQueryClient();
  return useMutation({
    ...Api.documents.updatePublicSharingMutationOptions(),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() });
      client.removeQueries({ queryKey: Api.documents.getPublicQueryKeyPrefix() });
    },
  });
}
