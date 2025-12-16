import * as React from "react";

import Api from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import * as Comments from "@/models/comments";
import { showErrorToast } from "turboui";

export function useOptimisticComments(opts: {
  taskId: string | null;
  parentType: Comments.CommentParentType;
  initialComments: Comments.Comment[];
}) {
  const { taskId, parentType, initialComments } = opts;

  const me = useMe();

  const [comments, setComments] = React.useState<Comments.Comment[]>(initialComments);

  React.useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const addComment = React.useCallback(
    async (targetTaskId: string, content: any) => {
      if (!taskId || targetTaskId !== taskId || !me) {
        showErrorToast("Error", "Failed to add comment.");
        return;
      }

      const tempId = `temp-comment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticComment: Comments.Comment = {
        id: tempId,
        author: me,
        content: JSON.stringify({ message: content }),
        insertedAt: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
        reactions: [],
      };

      setComments((prev) => [optimisticComment, ...prev]);

      try {
        const res = await Api.createComment({
          entityId: targetTaskId,
          entityType: "project_task",
          content: JSON.stringify(content),
        });

        const realId = res?.comment?.id;
        const realInsertedAt = res?.comment?.insertedAt;

        if (!realId) {
          setComments((prev) => prev.filter((c) => c.id !== tempId));
          showErrorToast("Error", "Failed to add comment.");
          return;
        }

        setComments((prev) => prev.map((c) => (c.id === tempId ? { ...c, id: realId, insertedAt: realInsertedAt ?? c.insertedAt } : c)));
      } catch {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        showErrorToast("Error", "Failed to add comment.");
      }
    },
    [me, taskId],
  );

  const editComment = React.useCallback(
    async (targetTaskId: string, commentId: string, content: any) => {
      const nextContent = JSON.stringify({ message: content });
      const prevComment = comments.find((c) => c.id === commentId) ?? null;

      if (!taskId || targetTaskId !== taskId || !prevComment) {
        showErrorToast("Error", "Failed to edit comment.");
        return;
      }

      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: nextContent } : c)));

      try {
        await Api.editComment({
          commentId,
          parentType,
          content: JSON.stringify(content),
        });
      } catch {
        setComments((prev) => prev.map((c) => (c.id === commentId ? prevComment : c)));
        showErrorToast("Error", "Failed to edit comment.");
      }
    },
    [comments, parentType, taskId],
  );

  const deleteComment = React.useCallback(
    async (targetTaskId: string, commentId: string) => {
      const prevComment = comments.find((c) => c.id === commentId) ?? null;

      if (!taskId || targetTaskId !== taskId || !prevComment) {
        showErrorToast("Error", "Failed to delete comment.");
        return;
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));

      try {
        await Api.deleteComment({
          commentId,
          parentType,
        });
      } catch {
        setComments((prev) => [prevComment, ...prev]);
        showErrorToast("Error", "Failed to delete comment.");
      }
    },
    [comments, parentType, taskId],
  );

  const addReaction = React.useCallback(
    async (targetTaskId: string, commentId: string, emoji: string) => {
      if (!taskId || targetTaskId !== taskId || !me) {
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
        const { reaction } = await Api.addReaction({
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
    [comments, me, taskId],
  );

  const removeReaction = React.useCallback(
    async (targetTaskId: string, _commentId: string, reactionId: string) => {
      if (!taskId || targetTaskId !== taskId) {
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
        await Api.removeReaction({ reactionId });
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
    [taskId],
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
