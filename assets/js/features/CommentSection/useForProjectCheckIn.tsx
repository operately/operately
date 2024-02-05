import * as Updates from "@/graphql/Projects/updates";

import { Item, ItemType, FormState } from "./form";

export function useForProjectCheckIn(update: Updates.Update): FormState {
  const { beforeAck, afterAck } = Updates.splitCommentsBeforeAndAfterAck(update);

  let items: Item[] = [];

  beforeAck.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  if (update.acknowledged) {
    items.push({ type: "acknowledgement" as ItemType, insertedAt: update.acknowledgedAt, value: update });
  }

  afterAck.forEach((c) => {
    items.push({ type: "comment" as ItemType, insertedAt: c!.insertedAt, value: c });
  });

  const [post, { loading: submittingPost }] = Updates.usePostComment();
  const [edit, { loading: submittingEdit }] = Updates.useEditComment();

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
