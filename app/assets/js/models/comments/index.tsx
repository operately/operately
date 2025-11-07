import * as api from "@/api";
import * as Time from "@/utils/time";
import * as People from "@/models/people";
import * as Reactions from "@/models/reactions";
import { Paths } from "@/routes/paths";

type Comment = api.Comment;

export type { CommentParentType } from "@/api";
export type { CommentableResource } from "./CommentableResource";

export type { Comment };
export { useCreateComment, useEditComment, useGetComments, getComments } from "@/api";
export { useReloadCommentsSignal } from "@/signals";
export { useEditComment as useEditCommentHandler } from "./useEditComment";
export { useDeleteComment as useDeleteCommentHandler } from "./useDeleteComment";

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

/**
 * Parses backend Comment objects to the format expected by TurboUI CommentSection
 *
 * @param paths - Paths helper for generating links
 * @param comments - Array of backend Comment objects
 * @returns Array of TurboUI Comment objects
 */
export function parseCommentsForTurboUi(paths: Paths, comments: Comment[]) {
  return comments.map((comment) => parseCommentForTurboUi(paths, comment));
}

function parseCommentForTurboUi(paths: Paths, comment: Comment) {
  const reactions = Reactions.parseReactionsForTurboUi(paths, comment.reactions);

  return {
    id: comment.id,
    content: comment.content || "{}",
    author: People.parsePersonForTurboUi(paths, comment.author),
    insertedAt: comment.insertedAt,
    reactions,
    notification: comment.notification,
    isSolution: Boolean(comment.isSolution),
    canMarkAsSolution: Boolean(comment.canMarkAsSolution),
    canUnmarkSolution: Boolean(comment.canUnmarkSolution),
  };
}
