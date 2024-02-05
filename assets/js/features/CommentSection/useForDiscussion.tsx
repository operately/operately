import * as Updates from "@/graphql/Projects/updates";
import * as Discussions from "@/models/discussions";

import { ItemType, FormState } from "./form";

export function useForDiscussion(discussion: Discussions.Discussion): FormState {
  const items = discussion.comments!.map((c) => {
    return {
      type: "comment" as ItemType,
      insertedAt: c!.insertedAt,
      value: {
        id: c!.id,
        insertedAt: c!.insertedAt,
        message: JSON.parse(c!.message),
        author: c!.author,
        reactions: c!.reactions,
      },
    };
  });

  const [post, { loading: submittingPost }] = Updates.usePostComment();
  const [edit, { loading: submittingEdit }] = Updates.useEditComment();

  const postComment = async (content: string) => {
    await post({
      variables: {
        input: {
          updateId: discussion.id,
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
