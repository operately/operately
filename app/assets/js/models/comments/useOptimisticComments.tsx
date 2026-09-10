import { type CommentQueryInvalidator } from "./commentLifecycle";
import { type Comment, type CommentParentType, type Reaction } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { showErrorToast } from "turboui";
import {
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useCreateCommentReactionMutation,
  useDeleteCommentReactionMutation,
} from "./commentLifecycle";
import { useOptimisticCommentUpdates, type CommentUpdate } from "./useOptimisticCommentUpdates";

let optimisticId = 0;
function temporaryId() {
  return `temp-${Date.now()}-${++optimisticId}`;
}

export function useOptimisticComments(opts: {
  taskId: string | null;
  parentType: CommentParentType;
  initialComments: Comment[];
  onAfterMutation?: () => void | Promise<void>;
  invalidateQueries?: CommentQueryInvalidator;
}) {
  const { taskId, parentType } = opts;
  const me = useMe();
  const { comments, getComments, run, reactionIds, isPending } = useOptimisticCommentUpdates(opts);
  const { mutateAsync: create } = useCreateCommentMutation(opts.invalidateQueries);
  const { mutateAsync: update } = useUpdateCommentMutation(opts.invalidateQueries);
  const { mutateAsync: remove } = useDeleteCommentMutation(opts.invalidateQueries);
  const { mutateAsync: createReaction } = useCreateCommentReactionMutation(opts.invalidateQueries);
  const { mutateAsync: deleteReaction } = useDeleteCommentReactionMutation(opts.invalidateQueries);

  function hasSavedComment(commentId: string) {
    return taskId && !commentId.startsWith("temp-") && getComments().some((comment) => comment.id === commentId);
  }

  async function addComment(content: unknown): Promise<boolean> {
    if (!taskId || !me) {
      showErrorToast("Error", "Failed to add comment.");
      return false;
    }
    const serialized = stringifyCommentContent(content);
    const optimistic: Comment = {
      __typename: "comment",
      id: temporaryId(),
      author: me,
      content: serialized,
      insertedAt: new Date().toISOString(),
      reactions: [],
    };
    return run(
      (current) => [optimistic, ...current],
      async () => {
        const { comment } = await create({ entityId: taskId, entityType: parentType, content: serialized });

        if (!comment?.id) throw new Error("Created comment is missing its id");

        const confirmed: Comment = {
          ...optimistic,
          ...comment,
          author: comment.author ?? optimistic.author,
          content: comment.content ?? optimistic.content,
          insertedAt: comment.insertedAt ?? optimistic.insertedAt,
          reactions: comment.reactions ?? [],
        };
        return (current) => [confirmed, ...current.filter((item) => item.id !== comment.id)];
      },
      "Failed to add comment.",
    );
  }

  async function editComment(commentId: string, content: unknown): Promise<boolean> {
    if (!hasSavedComment(commentId)) {
      showErrorToast("Error", "Failed to edit comment.");
      return false;
    }
    const serialized = stringifyCommentContent(content);
    const apply = changeComment(commentId, (comment) => ({ ...comment, content: serialized }));
    return run(
      apply,
      async () => {
        const { comment } = await update({ commentId, parentType, content: serialized });
        return changeComment(commentId, (current) => ({ ...current, content: comment?.content ?? serialized }));
      },
      "Failed to edit comment.",
    );
  }

  async function deleteComment(commentId: string): Promise<void> {
    if (!hasSavedComment(commentId)) {
      showErrorToast("Error", "Failed to delete comment.");
      return;
    }
    const apply: CommentUpdate = (current) => current.filter((comment) => comment.id !== commentId);
    await run(
      apply,
      async () => {
        await remove({ commentId, parentType });
        return apply;
      },
      "Failed to delete comment.",
    );
  }

  async function addReaction(commentId: string, emoji: string): Promise<void> {
    if (!me || !hasSavedComment(commentId)) {
      showErrorToast("Error", "Failed to add reaction.");
      return;
    }
    const optimistic: Reaction = { __typename: "reaction", id: temporaryId(), emoji, person: me };
    const append = (reaction: Reaction) =>
      changeComment(commentId, (comment) => ({
        ...comment,
        reactions: [...(comment.reactions ?? []).filter((item) => item.id !== reaction.id), reaction],
      }));
    await run(
      append(optimistic),
      async () => {
        const { reaction } = await createReaction({ entityId: commentId, entityType: "comment", parentType, emoji });
        if (!reaction?.id) throw new Error("Created reaction is missing its id");
        reactionIds.set(optimistic.id, reaction.id);
        return append({ ...reaction, person: reaction.person ?? optimistic.person });
      },
      "Failed to add reaction.",
    );
  }

  async function removeReaction(commentId: string, reactionId: string): Promise<void> {
    if (!hasSavedComment(commentId)) {
      showErrorToast("Error", "Failed to remove reaction.");
      return;
    }
    const apply = changeComment(commentId, (comment) => ({
      ...comment,
      reactions: (comment.reactions ?? []).filter(
        (reaction) => reaction.id !== reactionId && reaction.id !== reactionIds.get(reactionId),
      ),
    }));
    await run(
      apply,
      async () => {
        const savedId = reactionIds.get(reactionId) ?? reactionId;
        // A failed create has no server reaction to delete. Successful creates resolve before this queued write.
        if (!savedId.startsWith("temp-")) await deleteReaction({ reactionId: savedId });
        return apply;
      },
      "Failed to remove reaction.",
    );
  }

  return { comments, isPending, addComment, editComment, deleteComment, addReaction, removeReaction };
}

function changeComment(commentId: string, change: (comment: Comment) => Comment): CommentUpdate {
  return (comments) => comments.map((comment) => (comment.id === commentId ? change(comment) : comment));
}

function stringifyCommentContent(content: unknown) {
  return JSON.stringify(content ?? {});
}
