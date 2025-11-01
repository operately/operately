import React from "react";
import * as api from "@/api";
import { showErrorToast } from "turboui";
import { compareIds } from "@/routes/paths";

export function useDeleteComment<T extends { id?: string | null }>(
  comments: T[],
  setComments: React.Dispatch<React.SetStateAction<T[]>>,
  parentType: api.CommentParentType,
  invalidateCache: () => void,
) {
  const handleDeleteComment = React.useCallback(
    async (commentId: string) => {
      const comment = comments.find((c) => c.id && compareIds(c.id, commentId));

      try {
        if (comment) {
          // Optimistically remove the comment from the list
          setComments((prev) => prev.filter((c) => !compareIds(c.id, commentId)));
        }

        await api.deleteComment({
          commentId,
          parentType,
        });

        invalidateCache();
      } catch (error) {
        if (comment) {
          // Rollback: restore the comment
          setComments((prev) => [...prev, comment]);
        }
        showErrorToast("Error", "Failed to delete comment.");
      }
    },
    [comments, parentType, invalidateCache, setComments],
  );

  return {
    handleDeleteComment,
  };
}
