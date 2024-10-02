import * as Projects from "@/models/projects";
import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { ItemType, FormState } from "./form";

export function useForProjectRetrospective(
  retrospective: Projects.ProjectRetrospective,
  comments: Comments.Comment[],
): FormState {
  const [post, { loading: submittingPost }] = Comments.useCreateComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();

  const items = comments.map((comment) => {
    return {
      type: "comment" as ItemType,
      insertedAt: Time.parse(comment.insertedAt)!,
      value: comment,
    };
  });

  const postComment = async (content: string) => {
    await post({
      entityId: retrospective.id,
      entityType: "project_retrospective",
      content: JSON.stringify(content),
    });
  };

  const editComment = async (commentID: string, content: string) => {
    await edit({
      commentId: commentID,
      content: JSON.stringify(content),
      parentType: "project_retrospective",
    });
  };

  return {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
    mentionSearchScope: { type: "project", id: retrospective.project!.id! },
  };
}
