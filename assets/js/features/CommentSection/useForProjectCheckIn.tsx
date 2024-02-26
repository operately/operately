import * as ProjectCheckIns from "@/models/projectCheckIns";
import * as Comments from "@/models/comments";

import { Item, ItemType, FormState } from "./form";

export function useForProjectCheckIn(checkIn: ProjectCheckIns.ProjectCheckIn): FormState {
  const entity = { id: checkIn.id, type: "project_check_in" };

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

  const { before, after } = Comments.splitComments(data.comments, checkIn.acknowledgedAt);

  let items: Item[] = [];

  before.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  if (checkIn.acknowledgedAt) {
    items.push({
      type: "acknowledgement" as ItemType,
      insertedAt: checkIn.acknowledgedAt,
      value: checkIn.acknowledgedBy,
    });
  }

  after.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  const postComment = async (content: string) => {
    await post({
      variables: {
        input: {
          entityId: entity.id,
          entityType: entity.type,
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

  const submitting = submittingPost || submittingEdit;

  return {
    items,
    postComment,
    editComment,
    submitting,
  };
}
