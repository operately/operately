import { useEffect, useState } from "react";

import * as Comments from "@/models/comments";
import { SearchScope } from "@/models/people";
import { Discussion } from "@/models/discussions";
import { ProjectRetrospective } from "@/models/projects";
import { ResourceHubDocument, ResourceHubFile, ResourceHubLink } from "@/models/resourceHubs";

import { assertPresent } from "@/utils/assertions";
import { parse } from "@/utils/time";
import { ItemType, FormState } from "./form";

interface ParentDiscussion {
  discussion: Discussion;
  parentType: "message";
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

type UseCommentsInput =
  | ParentDiscussion
  | ParentProjectRetrospective
  | ParentResourceHubDocument
  | ParentResourceHubFile
  | ParentResourceHubLink;

export function useComments(props: UseCommentsInput): FormState {
  const parent = findParent(props);
  const [post, { loading: submittingPost }] = Comments.useCreateComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();
  const { items, loading, error, refetch } = useLoadAndReloadComments(parent.id, props.parentType);

  Comments.useDiscussionCommentsChangeSignal(refetch, { discussionId: parent.id! });

  const postComment = async (content: string) => {
    await post({
      entityId: parent.id,
      entityType: props.parentType,
      content: JSON.stringify(content),
    });
  };

  const editComment = async (commentID: string, content: string) => {
    await edit({
      commentId: commentID,
      content: JSON.stringify(content),
      parentType: props.parentType,
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
    mentionSearchScope: findMentionedScope(props),
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

function findParent(props: UseCommentsInput) {
  switch (props.parentType) {
    case "message":
      return props.discussion;
    case "project_retrospective":
      return props.retrospective;
    case "resource_hub_document":
      return props.document;
    case "resource_hub_file":
      return props.file;
    case "resource_hub_link":
      return props.link;
  }
}

function findMentionedScope(props: UseCommentsInput): SearchScope {
  switch (props.parentType) {
    case "message":
      assertPresent(props.discussion.space, "space must be present in discussion");
      return { type: "space", id: props.discussion.space.id! };
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
  }
}
