import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { Item, ItemType } from "./form";

export function useForGoalCheckIn(update: GoalCheckIns.Update) {
  const { data, loading, error, refetch } = Comments.useGetComments({
    entityId: update.id!,
    entityType: "update",
  });

  const [post, { loading: submittingPost }] = Comments.useCreateComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();

  if (loading)
    return {
      items: [],
      postComment: async (_content: string) => {},
      editComment: async (_commentID: string, _content: string) => {},
      submitting: false,
    };

  if (error) throw error;

  const { before, after } = Comments.splitComments(data!.comments!, update.acknowledgedAt!);

  let items: Item[] = [];

  before.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: Time.parse(c.insertedAt)!, value: c });
  });

  if (update.acknowledged) {
    items.push({
      type: "acknowledgement" as ItemType,
      insertedAt: Time.parse(update.acknowledgedAt)!,
      value: update.acknowledgingPerson,
    });
  }

  after.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: Time.parse(c.insertedAt)!, value: c });
  });

  const postComment = async (content: string) => {
    await post({
      entityType: "update",
      entityId: update.id,
      content: JSON.stringify(content),
    });

    refetch();
  };

  const editComment = async (commentID: string, content: string) => {
    await edit({
      commentId: commentID,
      content: JSON.stringify(content),
    });

    refetch();
  };

  return {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
  };
}
