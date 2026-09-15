import Api from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  invalidateDiscussionQueries,
  invalidateDiscussionDetailQueries,
  invalidateDiscussionListQueries,
} from "./discussionQueries";

export function usePostDiscussion() {
  const client = useQueryClient();
  return useMutation({
    ...Api.spaces.createDiscussionMutationOptions(),
    onSuccess: ({ discussion }, { spaceId }) =>
      invalidateDiscussionQueries(client, { spaceId, discussionId: discussion.id }),
  });
}

export function useEditDiscussion(spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    ...Api.spaces.updateDiscussionMutationOptions(),
    onMutate: () => ({ spaceId }),
    onSuccess: (_result, { id }, context: { spaceId: string }) =>
      invalidateDiscussionQueries(client, { spaceId: context.spaceId, discussionId: id }),
  });
}

export function usePublishDiscussion(spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    ...Api.spaces.publishDiscussionMutationOptions(),
    onMutate: () => ({ spaceId }),
    onSuccess: (_result, { id }, context: { spaceId: string }) =>
      invalidateDiscussionQueries(client, { spaceId: context.spaceId, discussionId: id }),
  });
}

export function useArchiveMessage(spaceId: string) {
  const client = useQueryClient();
  return useMutation({
    ...Api.spaces.archiveDiscussionMutationOptions(),
    onMutate: () => ({ spaceId }),
    onSuccess: async (_result, { id }, context: { spaceId: string }) => {
      await Promise.all([
        invalidateDiscussionDetailQueries(client, id, "none"),
        invalidateDiscussionListQueries(client, context.spaceId),
      ]);
    },
  });
}
