import Api from "@/api";
import { QueryClient, useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";

export async function invalidateCommentQueries(queryClient: QueryClient, refetchType: "active" | "none" = "active") {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.comments.listQueryKeyPrefix(), refetchType }),
    queryClient.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix(), refetchType }),
    // Mentioning someone in a comment can subscribe them to the task.
    queryClient.invalidateQueries({ queryKey: Api.tasks.getQueryKeyPrefix(), refetchType }),
  ]);
}

export function useCreateCommentMutation() {
  return useCommentMutation(Api.comments.createMutationOptions());
}

export function useUpdateCommentMutation() {
  return useCommentMutation(Api.comments.updateMutationOptions());
}

export function useDeleteCommentMutation() {
  return useCommentMutation(Api.comments.deleteMutationOptions());
}

export function useCreateCommentReactionMutation() {
  return useCommentMutation(Api.reactions.createMutationOptions());
}

export function useDeleteCommentReactionMutation() {
  return useCommentMutation(Api.reactions.deleteMutationOptions());
}

function useCommentMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    // Refresh once the optimistic batch settles, so refetches cannot erase pending changes.
    onSuccess: () => invalidateCommentQueries(queryClient, "none"),
  });
}
