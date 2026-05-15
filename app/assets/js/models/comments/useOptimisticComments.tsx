import * as React from "react";

import Api from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import * as Comments from "@/models/comments";
import { showErrorToast } from "turboui";

export function useOptimisticComments(opts: {
  taskId: string | null;
  parentType: Comments.CommentParentType;
  initialComments: Comments.Comment[];
  onAfterMutation?: () => void;
}) {
  const { taskId, parentType, initialComments, onAfterMutation } = opts;

  const me = useMe();

  const [comments, setComments] = React.useState<Comments.Comment[]>(initialComments);

  React.useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const addComment = React.useCallback(
    async (content: any) => {
      if (!taskId || !me) {
        showErrorToast("Error", "Failed to add comment.");
        return false;
      }

      const tempId = `temp-comment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticComment: Comments.Comment = {
        id: tempId,
        author: me,
        content: stringifyCommentContent(content),
        insertedAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
        reactions: [],
      };

      setComments((prev) => [optimisticComment, ...prev]);

      try {
        const res = await Api.comments.create({
          entityId: taskId,
          entityType: parentType,
          content: stringifyCommentContent(content),
        });

        const realId = res?.comment?.id;
        const realInsertedAt = res?.comment?.insertedAt;

        if (!realId) {
          setComments((prev) => prev.filter((c) => c.id !== tempId));
          showErrorToast("Error", "Failed to add comment.");
          return false;
        }

        setComments((prev) => prev.map((c) => (c.id === tempId ? { ...c, id: realId, insertedAt: realInsertedAt ?? c.insertedAt } : c)));

        onAfterMutation?.();
        return true;
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        showErrorToast("Error", "Failed to add comment.");
        return false;
      }
    },
    [parentType, me, onAfterMutation, taskId],
  );

  const editComment = React.useCallback(
    async (commentId: string, content: any) => {
      const nextContent = stringifyCommentContent(content);
      const prevComment = comments.find((c) => c.id === commentId) ?? null;

      if (!taskId || !prevComment) {
        showErrorToast("Error", "Failed to edit comment.");
        return false;
      }

      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: nextContent } : c)));

      try {
        await Api.comments.update({
          commentId,
          parentType,
          content: stringifyCommentContent(content),
        });

        onAfterMutation?.();
        return true;
      } catch {
        setComments((prev) => prev.map((c) => (c.id === commentId ? prevComment : c)));
        showErrorToast("Error", "Failed to edit comment.");
        return false;
      }
    },
    [comments, onAfterMutation, parentType, taskId],
  );

  const deleteComment = React.useCallback(
    async (commentId: string) => {
      const prevComment = comments.find((c) => c.id === commentId) ?? null;

      if (!taskId || !prevComment) {
        showErrorToast("Error", "Failed to delete comment.");
        return;
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));

      try {
        await Api.comments.delete({
          commentId,
          parentType,
        });

        onAfterMutation?.();
      } catch {
        setComments((prev) => [prevComment, ...prev]);
        showErrorToast("Error", "Failed to delete comment.");
      }
    },
    [comments, onAfterMutation, parentType, taskId],
  );

  const addReaction = React.useCallback(
    async (commentId: string, emoji: string) => {
      if (!taskId || !me) {
        showErrorToast("Error", "Failed to add reaction.");
        return;
      }

      const prevComment = comments.find((c) => c.id === commentId) ?? null;
      if (!prevComment || commentId.startsWith("temp-")) {
        showErrorToast("Error", "Failed to add reaction.");
        return;
      }

      const tempReactionId = `temp-${Date.now()}`;
      const optimisticReaction = {
        id: tempReactionId,
        emoji,
        person: me,
      };

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, reactions: [...(c.reactions ?? []), optimisticReaction] } : c)),
      );

      try {
        const { reaction } = await Api.reactions.create({
          entityId: commentId,
          entityType: "comment",
          parentType,
          emoji,
        });

        const realId = reaction?.id;

        if (!realId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    reactions: (c.reactions ?? []).filter((r: any) => r.id !== tempReactionId),
                  }
                : c,
            ),
          );
          showErrorToast("Error", "Failed to add reaction.");
          return;
        }

        setComments((prev) =>
          prev.map((c) => {
            if (c.id !== commentId) return c;

            return {
              ...c,
              reactions: (c.reactions ?? []).map((r: any) => (r.id === tempReactionId ? { ...r, id: realId } : r)),
            };
          }),
        );

        onAfterMutation?.();
      } catch {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  reactions: (c.reactions ?? []).filter((r: any) => r.id !== tempReactionId),
                }
              : c,
          ),
        );
        showErrorToast("Error", "Failed to add reaction.");
      }
    },
    [comments, me, onAfterMutation, taskId],
  );

  const removeReaction = React.useCallback(
    async (_commentId: string, reactionId: string) => {
      if (!taskId) {
        showErrorToast("Error", "Failed to remove reaction.");
        return;
      }

      let removedReaction: any = null;

      setComments((prev) =>
        prev.map((c) => {
          const reactions = c.reactions ?? [];
          const found = reactions.find((r: any) => r.id === reactionId);
          if (found) removedReaction = found;
          return found ? { ...c, reactions: reactions.filter((r: any) => r.id !== reactionId) } : c;
        }),
      );

      if (reactionId.startsWith("temp-")) return;

      try {
        await Api.reactions.delete({ reactionId: reactionId });

        onAfterMutation?.();
      } catch {
        if (removedReaction) {
          setComments((prev) =>
            prev.map((c) => {
              if (!c.reactions) return c;
              const stillMissing = !c.reactions.some((r: any) => r.id === reactionId);
              return stillMissing ? { ...c, reactions: [...c.reactions, removedReaction] } : c;
            }),
          );
        }
        showErrorToast("Error", "Failed to remove reaction.");
      }
    },
    [onAfterMutation, taskId],
  );

  return {
    comments,
    addComment,
    editComment,
    deleteComment,
    addReaction,
    removeReaction,
  };
}

function stringifyCommentContent(content: unknown) {
  return JSON.stringify(content ?? {});
}
