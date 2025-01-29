import { useEffect, useState } from "react";

import * as Comments from "@/models/comments";
import { SearchScope } from "@/models/people";
import { Goal } from "@/models/goals";
import { CommentThread } from "@/models/activities";
import { Discussion } from "@/models/discussions";
import { ProjectCheckIn } from "@/models/projectCheckIns";
import { ProjectRetrospective } from "@/models/projects";
import { Update } from "@/models/goalCheckIns";
import { ResourceHubDocument, ResourceHubFile, ResourceHubLink } from "@/models/resourceHubs";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { assertPresent } from "@/utils/assertions";
import { parse } from "@/utils/time";

import { FormState } from "./form";
import { useEditComment } from "./utils";

interface ParentDiscussion {
  discussion: Discussion;
  parentType: "message";
}

interface ParentProjectCheckIn {
  checkIn: ProjectCheckIn;
  parentType: "project_check_in";
}

interface ParentProjectRetrospective {
  retrospective: ProjectRetrospective;
  parentType: "project_retrospective";
}

interface ParentResourceHubDocument {
  document: ResourceHubDocument;
  parentType: "resource_hub_document";
}

interface ParentResourceHubFile {
  file: ResourceHubFile;
  parentType: "resource_hub_file";
}

interface ParentResourceHubLink {
  link: ResourceHubLink;
  parentType: "resource_hub_link";
}

interface ParentGoalUpdate {
  update: Update;
  parentType: "goal_update";
}

interface ParentCommentThread {
  thread: CommentThread;
  goal: Goal;
  parentType: "comment_thread";
}

type UseCommentsInput =
  | ParentDiscussion
  | ParentProjectCheckIn
  | ParentProjectRetrospective
  | ParentResourceHubDocument
  | ParentResourceHubFile
  | ParentResourceHubLink
  | ParentGoalUpdate
  | ParentCommentThread;

export function useComments(props: UseCommentsInput): FormState {
  const parent = findParent(props);

  const { items, setItems, loading, error, refetch } = useLoadAndReloadComments(parent.id!, props.parentType);
  const { postComment, loading: creating } = useCreateComment(setItems, parent.id, props.parentType);
  const { editComment, loading: editing } = useEditComment({
    comments: items,
    setComments: setItems,
    parentType: props.parentType,
  });

  Comments.useDiscussionCommentsChangeSignal(refetch, { discussionId: parent.id! });

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
    submitting: creating || editing,
    mentionSearchScope: findMentionedScope(props),
  };
}

function useLoadAndReloadComments(parentId: string, parentType: UseCommentsInput["parentType"]) {
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

function useCreateComment(setComments, entityId, entityType) {
  const me = useMe()!;
  const [post, { loading }] = Comments.useCreateComment();

  const postComment = async (content: string) => {
    const tempId = `temp-${Date.now()}`;

    setComments((comments) => {
      const newComment: Comments.Comment = {
        id: tempId,
        insertedAt: new Date().toISOString(),
        content: JSON.stringify({ message: content }),
        author: me,
        reactions: [],
      };

      return [...comments, parseComment(newComment)];
    });

    try {
      const res = await post({
        entityId,
        entityType,
        content: JSON.stringify(content),
      });

      setComments((comments) => {
        return comments.map((c) => {
          if (c.value.id === tempId) {
            const comment = { ...c.value, id: res.comment?.id };
            return parseComment(comment);
          } else {
            return c;
          }
        });
      });
    } catch (error) {
      setComments((comments) => {
        return comments.filter((c) => c.value.id !== tempId);
      });
    }
  };

  return { postComment, loading };
}

//
// Helpers
//

function parseComments(comments?: Comments.Comment[] | null) {
  if (!comments) return [];
  return comments.map((comment) => parseComment(comment));
}

function parseComment(comment: Comments.Comment) {
  return {
    type: "comment" as Comments.ItemType,
    insertedAt: parse(comment.insertedAt)!,
    value: comment,
  };
}

function findParent(props: UseCommentsInput) {
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

function findMentionedScope(props: UseCommentsInput): SearchScope {
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
      assertPresent(props.goal?.id, "Goal must be provided along with CommentThread");
      return { type: "goal", id: props.goal.id };
  }
}
