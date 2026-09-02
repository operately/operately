import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateProjectDiscussionQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.projects.getDiscussionQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.listDiscussionsQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix() }),
  ]);
}

export function useCreateProjectDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.createDiscussionMutationOptions(),
    onSuccess: () => {
      void invalidateProjectDiscussionQueries(queryClient);
    },
  });
}

export function useUpdateProjectDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.updateDiscussionMutationOptions(),
    onSuccess: () => {
      void invalidateProjectDiscussionQueries(queryClient);
    },
  });
}
