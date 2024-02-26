import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Comments from "@/models/comments";

import { Item, ItemType } from "./form";

export function useForGoalCheckIn(update: GoalCheckIns.GoalCheckIn) {
  const comments = (update.comments || []).map((c) => c! as Comments.Comment);
  const { before, after } = Comments.splitComments(comments, update.acknowledgedAt);

  let items: Item[] = [];

  before.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  if (update.acknowledged) {
    items.push({ type: "acknowledgement" as ItemType, insertedAt: update.acknowledgedAt, value: update });
  }

  after.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  const [post, { loading: submittingPost }] = Comments.usePostComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();

  const postComment = async (content: string) => {
    await post({
      variables: {
        input: {
          updateId: update.id,
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
