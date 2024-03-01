import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Comments from "@/models/comments";

import { Item, ItemType } from "./form";

export function useForGoalCheckIn(update: GoalCheckIns.GoalCheckIn) {
  const entity = { id: update.id, type: "update" };
  const { data, loading, error, refetch } = Comments.useComments({ entity });

  const [post, { loading: submittingPost }] = Comments.usePostComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();

  if (loading)
    return {
      items: [],
      postComment: async (_content: string) => {},
      editComment: async (_commentID: string, _content: string) => {},
      submitting: false,
    };

  if (error) throw error;

  const { before, after } = Comments.splitComments(data.comments, update.acknowledgedAt);

  let items: Item[] = [];

  before.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  if (update.acknowledged) {
    items.push({
      type: "acknowledgement" as ItemType,
      insertedAt: update.acknowledgedAt,
      value: update.acknowledgingPerson,
    });
  }

  after.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  const postComment = async (content: string) => {
    await post({
      variables: {
        input: {
          entityType: "update",
          entityId: update.id,
          content: JSON.stringify(content),
        },
      },
    });

    await refetch();
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

    await refetch();
  };

  return {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
  };
}
