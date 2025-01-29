import * as api from "@/api";
import * as Time from "@/utils/time";

type Comment = api.Comment;

export type CommentParentType =
  | "project_check_in"
  | "comment_thread"
  | "goal_update"
  | "message"
  | "milestone"
  | "project_retrospective"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link";

export type { Comment };
export { useCreateComment, useEditComment, useGetComments, getComments } from "@/api";
export { useDiscussionCommentsChangeSignal } from "@/signals";

export type ItemType = "comment" | "acknowledgement" | "milestone-completed" | "milestone-reopened";

export interface CommentItem {
  type: ItemType;
  insertedAt: Date;
  value: any;
}

export function splitComments(
  comments: CommentItem[],
  timestamp: string,
): { before: CommentItem[]; after: CommentItem[] } {
  const before = comments.filter((comment) => {
    return Time.parse(comment.insertedAt)! < Time.parse(timestamp)!;
  });

  const after = comments.filter((comment) => {
    return Time.parse(comment.insertedAt)! >= Time.parse(timestamp)!;
  });

  return { before, after };
}
