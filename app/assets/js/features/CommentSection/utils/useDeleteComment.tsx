import React from "react";

import Api from "@/api";
import * as Comments from "@/models/comments";
import { compareIds } from "@/routes/paths";
import { showErrorToast } from "turboui";

interface UseDeleteComment {
  comments: Comments.CommentItem[];
  setComments: React.Dispatch<React.SetStateAction<Comments.CommentItem[]>>;
  parentType: Comments.CommentParentType;
  refetch: () => void;
}

export function useDeleteComment({ comments, setComments, parentType, refetch }: UseDeleteComment) {
  const [loading, setLoading] = React.useState(false);

  const deleteComment = React.useCallback(
    async (commentID: string) => {
      const commentIndex = comments.findIndex(
        (item) => item.type === "comment" && item.value?.id && compareIds(item.value.id, commentID),
      );

      if (commentIndex === -1) {
        return;
      }

      const commentItem = comments[commentIndex];

      setComments((prev) =>
        prev.filter((item) => !(item.type === "comment" && item.value?.id && compareIds(item.value.id, commentID))),
      );

      setLoading(true);

      try {
        await Api.deleteComment({
          commentId: commentID,
          parentType,
        });

        refetch();
      } catch (error) {
        if (commentItem) {
          setComments((prev) => {
            const next = [...prev];
            next.splice(Math.min(commentIndex, next.length), 0, commentItem);
            return next;
          });
        }

        showErrorToast("Error", "Failed to delete comment.");
      } finally {
        setLoading(false);
      }
    },
    [comments, parentType, refetch, setComments],
  );

  return { deleteComment, loading };
}
