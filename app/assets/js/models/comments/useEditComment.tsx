import React from "react";
import * as api from "@/api";
import { showErrorToast } from "turboui";
import { compareIds } from "@/routes/paths";

export function useEditComment<T extends { id?: string | null; content?: any }>(
  comments: T[],
  setComments: React.Dispatch<React.SetStateAction<T[]>>,
  parentType: api.CommentParentType,
  invalidateCache: () => void,
) {
  const handleEditComment = React.useCallback(
    async (commentId: string, content: any) => {
      const comment = comments.find((c) => c.id && compareIds(c.id, commentId));

      try {
        if (comment) {
          setComments((prev) =>
            prev.map((c) =>
              compareIds(c.id, commentId) ? { ...c, content: JSON.stringify({ message: content }) } : c,
            ),
          );
        }

        await api.editComment({
          commentId,
          parentType,
          content: JSON.stringify(content),
        });

        invalidateCache();
      } catch (error) {
        if (comment) {
          setComments((prev) => prev.map((c) => (compareIds(c.id, commentId) ? { ...comment } : c)));
        }
        showErrorToast("Error", "Failed to edit comment.");
      }
    },
    [comments, parentType, invalidateCache, setComments],
  );

  return {
    handleEditComment,
  };
}
