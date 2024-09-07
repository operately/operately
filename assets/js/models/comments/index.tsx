import * as api from "@/api";
import * as Time from "@/utils/time";

type Comment = api.Comment;

export { useCreateComment, useEditComment, useGetComments } from "@/api";
export { useDiscussionCommentsChangeSignal } from "@/api/socket";

export function splitComments(comments: Comment[], timestamp: string): { before: Comment[]; after: Comment[] } {
  const before = comments.filter((comment) => {
    return Time.parse(comment.insertedAt)! < Time.parse(timestamp)!;
  });

  const after = comments.filter((comment) => {
    return Time.parse(comment.insertedAt)! >= Time.parse(timestamp)!;
  });

  return { before, after };
}
