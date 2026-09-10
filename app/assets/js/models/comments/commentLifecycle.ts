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

export function useCreateCommentMutation(invalidate: CommentQueryInvalidator = invalidateCommentQueries) {
  return useCommentMutation(Api.comments.createMutationOptions(), invalidate);
}

export function useUpdateCommentMutation(invalidate: CommentQueryInvalidator = invalidateCommentQueries) {
  return useCommentMutation(Api.comments.updateMutationOptions(), invalidate);
}

export function useDeleteCommentMutation(invalidate: CommentQueryInvalidator = invalidateCommentQueries) {
  return useCommentMutation(Api.comments.deleteMutationOptions(), invalidate);
}

export function useCreateCommentReactionMutation(invalidate: CommentQueryInvalidator = invalidateCommentQueries) {
  return useCommentMutation(Api.reactions.createMutationOptions(), invalidate);
}

export function useDeleteCommentReactionMutation(invalidate: CommentQueryInvalidator = invalidateCommentQueries) {
  return useCommentMutation(Api.reactions.deleteMutationOptions(), invalidate);
}

export type CommentQueryInvalidator = (client: QueryClient, refetchType: "active" | "none") => Promise<void>;

function useCommentMutation<TData, TError, TVariables>(
  options: Pick<UseMutationOptions<TData, TError, TVariables>, "mutationFn" | "mutationKey" | "retry">,
  invalidate: CommentQueryInvalidator,
) {
  const queryClient = useQueryClient();

  // Keep the invalidator with each request, including writes queued before navigation.
  const mutation = useMutation<TData, TError, { input: TVariables; invalidate: CommentQueryInvalidator }>({
    mutationKey: options.mutationKey,
    retry: options.retry,
    mutationFn: ({ input }, context) => {
      if (!options.mutationFn) throw new Error("Comment mutation function is unavailable");
      return options.mutationFn(input, context);
    },
    // Refresh once the optimistic batch settles, so refetches cannot erase pending changes.
    onSuccess: (_result, request) => request.invalidate(queryClient, "none"),
  });

  return {
    ...mutation,
    variables: mutation.variables?.input,
    mutate: (input: TVariables) => mutation.mutate({ input, invalidate }),
    mutateAsync: (input: TVariables) => mutation.mutateAsync({ input, invalidate }),
  };
}
