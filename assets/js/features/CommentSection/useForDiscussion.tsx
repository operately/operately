import * as Discussions from "@/models/discussions";
import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { ItemType, FormState } from "./form";

export function useForDiscussion(discussion: Discussions.Discussion): FormState {
  const items = discussion.comments!.map((c) => {
    return {
      type: "comment" as ItemType,
      insertedAt: Time.parse(c.insertedAt)!,
      value: c,
    };
  });

  const [post, { loading: submittingPost }] = Comments.usePostComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();

  const postComment = async (content: string) => {
    await post({
      variables: {
        input: {
          entityId: discussion.id,
          entityType: "update",
          content: JSON.stringify(content),
        },
      },
    });
  };

  const editComment = async (commentID: string, content: string) => {
    await edit({
      variables: {
        input: {
          commentId: commentID,
          content: JSON.stringify(content),
        },
      },
    });
  };

  return {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
  };
}
