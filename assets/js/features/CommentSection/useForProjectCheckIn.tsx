import * as ProjectCheckIns from "@/models/projectCheckIns";
import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";

import { Item, ItemType, FormState } from "./form";

export function useForProjectCheckIn(checkIn: ProjectCheckIns.ProjectCheckIn): FormState {
  const { data, loading, error, refetch } = Comments.useGetComments({
    entityId: checkIn.id!,
    entityType: "project_check_in",
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

  const { before, after } = Comments.splitComments(data!.comments!, checkIn.acknowledgedAt);

  let items: Item[] = [];

  before.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: Time.parse(c.insertedAt)!, value: c });
  });

  if (checkIn.acknowledgedAt) {
    items.push({
      type: "acknowledgement" as ItemType,
      insertedAt: checkIn.acknowledgedAt,
      value: checkIn.acknowledgedBy,
    });
  }

  after.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: Time.parse(c.insertedAt)!, value: c });
  });

  const postComment = async (content: string) => {
    await post({
      entityId: checkIn.id,
      entityType: "project_check_in",
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

  const submitting = submittingPost || submittingEdit;

  return {
    items,
    postComment,
    editComment,
    submitting,
  };
}
