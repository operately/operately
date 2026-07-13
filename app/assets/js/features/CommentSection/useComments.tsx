import { useEffect, useState } from "react";
import * as Comments from "@/models/comments";

import { FormState } from "./form";
import { findMentionedScope } from "./mentionSearchScope";
import { parseComments, useCreateComment, useDeleteComment, useEditComment } from "./utils";

export function useComments(props: Comments.CommentableResource): FormState {
  const parent = findParent(props);

  const { items, setItems, loading, error, refetch } = useLoadAndReloadComments(parent.id!, props.parentType);
  Comments.useReloadCommentsSignal(refetch, { resourceId: parent.id! });

  const { postComment, loading: creating } = useCreateComment({
    setComments: setItems,
    entityId: parent.id!,
    entityType: props.parentType,
  });
  const { editComment, loading: editing } = useEditComment({
    comments: items,
    setComments: setItems,
    parentType: props.parentType,
  });
  const { deleteComment, loading: deleting } = useDeleteComment({
    comments: items,
    setComments: setItems,
    parentType: props.parentType,
    refetch,
  });

  if (loading && items.length < 1)
    return {
      items: [],
      postComment: async (_content: string) => {},
      editComment: async (_commentID: string, _content: string) => {},
      deleteComment: async (_commentID: string) => {},
      submitting: false,
      mentionSearchScope: { type: "none" },
      commentDraftKey: undefined,
      editCommentDraftKey: undefined,
    };

  if (error) throw error;

  return {
    items,
    postComment,
    editComment,
    deleteComment,
    submitting: creating || editing || deleting,
    mentionSearchScope: findMentionedScope(props),
    commentDraftKey: `${props.parentType}:${parent.id}:new-comment`,
    editCommentDraftKey: (commentID: string) => `${props.parentType}:${parent.id}:edit-comment:${commentID}`,
  };
}

function useLoadAndReloadComments(parentId: string, parentType: Comments.CommentableResource["parentType"]) {
  const { data, loading, error, refetch } = Comments.useGetComments({
    entityId: parentId,
    entityType: parentType,
  });
  const [items, setItems] = useState(parseComments(data?.comments));

  useEffect(() => {
    if (!data?.comments) return;

    setItems((prev) => {
      const pending = prev.filter(Comments.isOptimisticComment);
      return [...parseComments(data.comments), ...pending];
    });
  }, [data]);

  return {
    items,
    setItems,
    loading,
    error,
    refetch,
  };
}

function findParent(props: Comments.CommentableResource) {
  switch (props.parentType) {
    case "message":
      return props.discussion;
    case "project_check_in":
      return props.checkIn;
    case "project_retrospective":
      return props.retrospective;
    case "resource_hub_document":
      return props.document;
    case "resource_hub_file":
      return props.file;
    case "resource_hub_link":
      return props.link;
    case "goal_update":
      return props.update;
    case "project_discussion":
    case "goal_discussion":
      return props.thread;
  }
}
