import React from "react";

import * as Comments from "@/models/comments";
import { usePostMilestoneComment } from "@/models/milestones";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { parseComment } from "./commentParser";

interface UseCreateComment {
  setComments: React.Dispatch<React.SetStateAction<Comments.CommentItem[]>>;
  entityId: string;
  entityType: Comments.CommentParentType;
}

export function useCreateComment({ setComments, entityId, entityType }: UseCreateComment) {
  const me = useMe()!;
  const { post, loading } = usePost({ entityId, entityType });

  const postComment = async (content: string) => {
    const tempId = `temp-${Date.now()}`;

    setComments((comments) => {
      const newComment: Comments.Comment = {
        __typename: "comment",
        id: tempId,
        insertedAt: new Date().toISOString(),
        content: Comments.stringifyCommentContent(content),
        author: me,
        reactions: [],
      };

      return [...comments, parseComment(newComment)];
    });

    try {
      const resComment = await post(content);

      setComments((comments) => {
        const alreadyPersisted = comments.some((c) => c.value.id === resComment.id);
        if (alreadyPersisted) {
          return comments.filter((c) => c.value.id !== tempId);
        }

        return comments.map((c) => {
          if (c.value.id === tempId) {
            const comment = {
              ...c.value,
              id: resComment.id,
              insertedAt: resComment.insertedAt ?? c.value.insertedAt,
            };
            return parseComment(comment);
          } else {
            return c;
          }
        });
      });
      return true;
    } catch (error) {
      setComments((comments) => {
        return comments.filter((c) => c.value.id !== tempId);
      });
      return false;
    }
  };

  return { postComment, loading };
}

interface UsePost {
  entityId: string;
  entityType: Comments.CommentParentType;
}

function usePost({ entityId, entityType }: UsePost) {
  const [postComment, { loading: commenting }] = Comments.useCreateComment();
  const [postMilestoneComment, { loading: milestoneCommenting }] = usePostMilestoneComment();

  const post = async (content: string) => {
    if (entityType === "milestone") {
      const res = await postMilestoneComment({
        milestoneId: entityId,
        content: Comments.stringifyCommentContent(content),
        action: "none",
      });
      return res.comment?.comment;
    } else {
      const res = await postComment({
        entityId,
        entityType,
        content: Comments.stringifyCommentContent(content),
      });
      return res.comment;
    }
  };

  return {
    post,
    loading: commenting || milestoneCommenting,
  };
}
