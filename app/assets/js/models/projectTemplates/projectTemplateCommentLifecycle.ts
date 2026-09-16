import Api, {
  type ProjectTemplateComment,
  type ProjectTemplatesListCommentsInput,
  type ProjectTemplatesListCommentsResult,
  type ProjectTemplatesUpdateCommentInput,
  type ProjectTemplatesUpdateCommentResult,
  type ProjectTemplatesDeleteCommentInput,
  type ProjectTemplatesDeleteCommentResult,
} from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

type CommentScope = ProjectTemplatesListCommentsInput;
type CommentMutationContext = { scope: CommentScope };

let optimisticIdCounter = 0;

function commentQueryFilters(scope: CommentScope) {
  const prefix = Api.project_templates.listCommentsQueryKeyPrefix();

  return {
    queryKey: prefix,
    predicate: (query: { queryKey: readonly unknown[] }) => {
      const input = query.queryKey[prefix.length] as CommentScope | undefined;

      return (
        input?.parentType === scope.parentType &&
        compareIds(input.templateId, scope.templateId) &&
        compareIds(input.parentId, scope.parentId)
      );
    },
  };
}

function mutationKey(scope: CommentScope) {
  return ["template-comments", scope.templateId, scope.parentType, scope.parentId];
}

function updateCachedComments(
  client: QueryClient,
  scope: CommentScope,
  update: (comments: ProjectTemplateComment[]) => ProjectTemplateComment[],
) {
  for (const query of client.getQueryCache().findAll(commentQueryFilters(scope))) {
    const wasInvalidated = query.state.isInvalidated;

    client.setQueryData<ProjectTemplatesListCommentsResult>(query.queryKey, (current) =>
      current ? { ...current, comments: update(current.comments) } : current,
    );

    // setQueryData marks the query fresh. Restore any refresh requested by an earlier write.
    if (wasInvalidated) {
      void client.invalidateQueries({ queryKey: query.queryKey, exact: true, refetchType: "none" });
    }
  }
}

async function markCommentsStale(client: QueryClient, scope: CommentScope) {
  await client.invalidateQueries({ ...commentQueryFilters(scope), refetchType: "none" }).catch((error) => {
    console.error("Failed to refresh template comments", error);
  });
}

async function refreshComments(client: QueryClient, scope: CommentScope) {
  // onSettled still counts the current mutation. Wait if another write is pending.
  const pendingWrites = client.isMutating({ mutationKey: mutationKey(scope) });
  if (pendingWrites > 1) return;

  const filters = commentQueryFilters(scope);

  await client
    .refetchQueries({
      ...filters,
      type: "active",
      predicate: (query) => filters.predicate(query) && query.state.isInvalidated,
    })
    .catch((error) => {
      // A failed refresh must not roll back a successful save.
      console.error("Failed to refresh template comments", error);
    });
}

/**
 * Updates cached comments after each write, with an immediate placeholder when adding.
 * Refreshes from the server after the last pending write so optimistic comments stay visible.
 */
export function useTemplateCommentMutations(scope: CommentScope) {
  const client = useQueryClient();
  const me = useMe();

  // TanStack runs writes for the same comment list in submission order.
  const mutationScope = { id: JSON.stringify(mutationKey(scope)) };

  const create = useMutation({
    ...Api.project_templates.createCommentMutationOptions(),
    mutationKey: mutationKey(scope),
    scope: mutationScope,
    onMutate: async (input) => {
      const originalScope = { templateId: input.templateId, parentType: input.parentType, parentId: input.parentId };
      const temporaryId = `temp-${++optimisticIdCounter}`;

      await client.cancelQueries(commentQueryFilters(originalScope));
      const now = new Date().toISOString();

      updateCachedComments(client, originalScope, (comments) => [
        ...comments,
        {
          __typename: "project_template_comment",
          id: temporaryId,
          parentType: input.parentType,
          parentId: input.parentId,
          content: typeof input.content === "string" ? input.content : JSON.stringify(input.content),
          author: me,
          position: comments.length,
          insertedAt: now,
          updatedAt: now,
        },
      ]);

      return { scope: originalScope, temporaryId };
    },
    onError: (_error, _input, origin) => {
      if (!origin) return;

      updateCachedComments(client, origin.scope, (comments) =>
        comments.filter((item) => item.id !== origin.temporaryId),
      );
    },
    onSuccess: ({ comment }, _input, origin) => {
      updateCachedComments(client, origin.scope, (comments) => {
        const hasPlaceholder = comments.some((item) => item.id === origin.temporaryId);
        const withoutSavedComment = comments.filter((item) => !compareIds(item.id, comment.id));

        if (!hasPlaceholder) {
          return [...withoutSavedComment, comment];
        }

        // Replace the placeholder in place to preserve the comment's position.
        return withoutSavedComment.map((item) => (item.id === origin.temporaryId ? comment : item));
      });

      return markCommentsStale(client, origin.scope);
    },
    onSettled: (_data, _error, _input, origin) => origin && refreshComments(client, origin.scope),
  });

  const update = useMutation<
    ProjectTemplatesUpdateCommentResult,
    Error,
    ProjectTemplatesUpdateCommentInput,
    CommentMutationContext
  >({
    ...Api.project_templates.updateCommentMutationOptions(),
    mutationKey: mutationKey(scope),
    scope: mutationScope,
    onMutate: () => ({ scope }),
    onSuccess: ({ comment }, _input, origin) => {
      updateCachedComments(client, origin.scope, (comments) =>
        comments.map((item) => (compareIds(item.id, comment.id) ? comment : item)),
      );
      return markCommentsStale(client, origin.scope);
    },
    onSettled: (_data, _error, _input, origin) => origin && refreshComments(client, origin.scope),
  });

  const remove = useMutation<
    ProjectTemplatesDeleteCommentResult,
    Error,
    ProjectTemplatesDeleteCommentInput,
    CommentMutationContext
  >({
    ...Api.project_templates.deleteCommentMutationOptions(),
    mutationKey: mutationKey(scope),
    scope: mutationScope,
    onMutate: () => ({ scope }),
    onSuccess: (result, input, origin) => {
      if (!result.success) return;

      updateCachedComments(client, origin.scope, (comments) =>
        comments.filter((item) => !compareIds(item.id, input.commentId)),
      );
      return markCommentsStale(client, origin.scope);
    },
    onSettled: (_data, _error, _input, origin) => origin && refreshComments(client, origin.scope),
  });

  return { create, update, remove };
}
