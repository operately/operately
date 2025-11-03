import { useEffect, useState } from "react";
import * as Comments from "@/models/comments";
import { SearchScope } from "@/models/people";
import { assertPresent } from "@/utils/assertions";

import { FormState } from "./form";
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
    };

  if (error) throw error;

  return {
    items,
    postComment,
    editComment,
    deleteComment,
    submitting: creating || editing || deleting,
    mentionSearchScope: findMentionedScope(props),
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

    setItems(parseComments(data.comments));
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
    case "comment_thread":
      return props.thread;
  }
}

function findMentionedScope(props: Comments.CommentableResource): SearchScope {
  switch (props.parentType) {
    case "message":
      assertPresent(props.discussion.space, "space must be present in discussion");
      return { type: "space", id: props.discussion.space.id! };
    case "project_check_in":
      assertPresent(props.checkIn?.project?.id, "project must be present in checkIn");
      return { type: "project", id: props.checkIn.project.id };
    case "project_retrospective":
      assertPresent(props.retrospective.project, "project must be present in retrospective");
      return { type: "project", id: props.retrospective.project.id! };
    case "resource_hub_document":
      assertPresent(props.document.resourceHub?.space, "resourceHub.space must be present in document");
      return { type: "space", id: props.document.resourceHub.space.id! };
    case "resource_hub_file":
      assertPresent(props.file.resourceHub?.space, "resourceHub.space must be present in file");
      return { type: "space", id: props.file.resourceHub.space.id! };
    case "resource_hub_link":
      assertPresent(props.link.resourceHub?.space, "resourceHub.space must be present in link");
      return { type: "space", id: props.link.resourceHub.space.id! };
    case "goal_update":
      assertPresent(props.update?.goal?.id, "goal must be present in update");
      return { type: "goal", id: props.update.goal.id };
    case "comment_thread":
      if (props.goal) {
        assertPresent(props.goal?.id, "Goal must be provided along with CommentThread");
        return { type: "goal", id: props.goal.id };
      }

      if (props.thread.project) {
        assertPresent(props.thread.project.id, "Project must be present in CommentThread");
        return { type: "project", id: props.thread.project.id };
      }

      throw new Error("CommentThread must have either goal or project defined");
  }
}
