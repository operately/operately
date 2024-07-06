import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { ItemType, FormState } from "./form";
import { CommentThread } from "@/api";

export function useForCommentThread(thread: CommentThread): FormState {
  const items = thread.comments!.map((c) => {
    return {
      type: "comment" as ItemType,
      insertedAt: Time.parse(c!.insertedAt)!,
      value: c,
    };
  });

  const [post, { loading: submittingPost }] = Comments.useCreateComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();

  const postComment = async (content: string) => {
    await post({
      entityId: thread.id,
      entityType: "comment_thread",
      content: JSON.stringify(content),
    });
  };

  const editComment = async (commentID: string, content: string) => {
    await edit({
      commentId: commentID,
      content: JSON.stringify(content),
    });
  };

  return {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
  };
}
