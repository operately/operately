import * as Updates from "@/graphql/Projects/updates";
import * as Milestones from "@/graphql/Projects/milestones";

import { Item, ItemType, FormState } from "./form";

export function useForMilestone(milestone: Milestones.Milestone): FormState {
  let items: Item[] = milestone.comments!.map((c) => {
    return { type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c.comment };
  });

  const [post, { loading: submittingPost }] = Updates.usePostComment();
  const [edit, { loading: submittingEdit }] = Updates.useEditComment();

  const postComment = async (content: string) => {
    await post({
      variables: {
        input: {
          milestoneID: milestone.id,
          content: JSON.stringify(content),
          action: "none",
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

  const res = {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
  };

  return res;
}
