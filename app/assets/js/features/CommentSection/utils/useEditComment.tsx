import React from "react";
import * as Comments from "@/models/comments";
import { parse } from "@/utils/time";

interface UseEditComment {
  comments: Comments.CommentItem[];
  setComments: React.Dispatch<React.SetStateAction<Comments.CommentItem[]>>;
  parentType: Comments.CommentParentType;
}

export function useEditComment({ comments, setComments, parentType }: UseEditComment) {
  const [edit, { loading }] = Comments.useEditComment();

  const editComment = async (commentID: string, content: string) => {
    setComments((comments) =>
      comments.map((c) => {
        if (c.value.id === commentID) {
          const comment = { ...c.value, content: Comments.stringifyCommentContent(content) };
          return parseComment(comment);
        } else {
          return c;
        }
      }),
    );

    try {
      await edit({
        commentId: commentID,
        content: Comments.stringifyCommentContent(content),
        parentType,
      });
      return true;
    } catch {
      const comment = comments.find((c) => c.value.id === commentID)!;

      setComments((comments) =>
        comments.map((c) => {
          if (c.value.id === commentID) {
            return comment;
          } else {
            return c;
          }
        }),
      );
      return false;
    }
  };

  return { editComment, loading };
}

function parseComment(comment: Comments.Comment): Comments.CommentItem {
  return {
    type: "comment" as Comments.ItemType,
    insertedAt: parse(comment.insertedAt)!,
    value: comment,
  };
}
