import * as Comments from "@/models/comments";
import * as Time from "@/utils/time";
import * as People from "@/models/people";

import { ItemType, FormState } from "./form";
import { CommentThread } from "@/api";

export function useForCommentThread(thread: CommentThread, mentionSearchScope: People.SearchScope): FormState {
  const { data, loading, error, refetch } = Comments.useGetComments({
    entityId: thread.id!,
    entityType: "comment_thread",
  });

  const [post, { loading: submittingPost }] = Comments.useCreateComment();
  const [edit, { loading: submittingEdit }] = Comments.useEditComment();

  if (loading)
    return {
      items: [],
      postComment: async (_content: string) => {},
      editComment: async (_commentID: string, _content: string) => {},
      submitting: false,
      mentionSearchScope,
    };

  if (error) throw error;

  const items = data!.comments!.map((c) => {
    return {
      type: "comment" as ItemType,
      insertedAt: Time.parse(c!.insertedAt)!,
      value: c,
    };
  });

  const postComment = async (content: string) => {
    await post({
      entityId: thread.id,
      entityType: "comment_thread",
      content: JSON.stringify(content),
    });

    refetch();
  };

  const editComment = async (commentID: string, content: string) => {
    await edit({
      commentId: commentID,
      content: JSON.stringify(content),
      parentType: "comment_thread",
    });

    refetch();
  };

  return {
    items,
    postComment,
    editComment,
    submitting: submittingPost || submittingEdit,
    mentionSearchScope,
  };
}
