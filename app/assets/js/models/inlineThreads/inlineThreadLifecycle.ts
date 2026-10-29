import Api from "@/api";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

export function invalidateInlineThreadQueries(client: QueryClient) {
  return client.invalidateQueries({ queryKey: Api.inline_threads.listQueryKeyPrefix() });
}

export function useInlineThreadMutations() {
  const client = useQueryClient();
  const onSuccess = () =>
    invalidateInlineThreadQueries(client).catch((error) => console.error("Failed to refresh inline threads", error));
  return {
    create: useMutation({ ...Api.inline_threads.createMutationOptions(), onSuccess }),
    reply: useMutation({ ...Api.inline_threads.replyMutationOptions(), onSuccess }),
    edit: useMutation({ ...Api.inline_threads.updateMessageMutationOptions(), onSuccess }),
    remove: useMutation({ ...Api.inline_threads.deleteMessageMutationOptions(), onSuccess }),
    resolve: useMutation({ ...Api.inline_threads.resolveMutationOptions(), onSuccess }),
    reopen: useMutation({ ...Api.inline_threads.reopenMutationOptions(), onSuccess }),
  };
}
