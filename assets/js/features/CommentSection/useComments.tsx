import { useEffect, useState } from "react";

import * as Comments from "@/models/comments";
import { Discussion } from "@/models/discussions";
import { ProjectRetrospective } from "@/models/projects";

import { parse } from "@/utils/time";
import { ItemType, FormState } from "./form";
import { SearchScope } from "@/models/people";

interface ParentDiscussion {
  parent: Discussion;
  parentType: "message";
}

interface ParentProjectRetrospective {
  parent: ProjectRetrospective;
  parentType: "project_retrospective";
}

type UseCommentsInput = ParentDiscussion | ParentProjectRetrospective;

export function useComments({ parent, parentType }: UseCommentsInput): FormState {
  const [post, { loading: submittingPost }] = Comments.useCreateComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();
  const { items, loading, error, refetch } = useLoadAndReloadComments(parent.id, parentType);

  Comments.useDiscussionCommentsChangeSignal(refetch, { discussionId: parent.id! });

  const postComment = async (content: string) => {
    await post({
      entityId: parent.id,
      entityType: parentType,
      content: JSON.stringify(content),
    });
  };

  const editComment = async (commentID: string, content: string) => {
    await edit({
      commentId: commentID,
      content: JSON.stringify(content),
      parentType: parentType,
    });
  };

  if (loading && items.length < 1)
    return {
      items: [],
      postComment: async (_content: string) => {},
      editComment: async (_commentID: string, _content: string) => {},
      submitting: false,
      mentionSearchScope: { type: "none" },
    };

  if (error) throw error;

  return {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
    mentionSearchScope: findMentionedScope({ parent, parentType }),
  };
}

function useLoadAndReloadComments(parentId, parentType) {
  const { data, loading, error, refetch } = Comments.useGetComments({
    entityId: parentId,
    entityType: parentType,
  });
  const [items, setItems] = useState(parseComments(data?.comments));

  useEffect(() => {
    if (!data?.comments) return;

    setItems(parseComments(data.comments));
  }, [data]);

  return {
    items,
    loading,
    error,
    refetch,
  };
}

function parseComments(comments?: Comments.Comment[] | null) {
  if (!comments) return [];

  return comments.map((comment) => {
    return {
      type: "comment" as ItemType,
      insertedAt: parse(comment.insertedAt)!,
      value: comment,
    };
  });
}

function findMentionedScope({ parent, parentType }: UseCommentsInput): SearchScope {
  switch (parentType) {
    case "message":
      return { type: "space", id: parent.space!.id! };
    case "project_retrospective":
      return { type: "project", id: parent.project!.id! };
  }
}
