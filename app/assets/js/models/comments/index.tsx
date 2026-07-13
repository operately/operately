import Api from "@/api";
import * as api from "@/api";
import * as Time from "@/utils/time";
import * as People from "@/models/people";
import * as Reactions from "@/models/reactions";
import { Paths } from "@/routes/paths";

type Comment = api.Comment;

export type { CommentParentType } from "@/api";
export type { CommentableResource } from "./CommentableResource";

export type { Comment };
export { useReloadCommentsSignal } from "@/signals";
export { useEditComment as useEditCommentHandler } from "./useEditComment";
export { useDeleteComment as useDeleteCommentHandler } from "./useDeleteComment";
export { useOptimisticComments } from "./useOptimisticComments";

export const useCreateComment = Api.comments.useCreate;
export const useEditComment = Api.comments.useUpdate;
export const useGetComments = Api.comments.useList;

export type ItemType = "comment" | "acknowledgement" | "milestone-completed" | "milestone-reopened";

export interface CommentItem {
  type: ItemType;
  insertedAt: Date;
  value: any;
}

function splitComments(
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

export function isOptimisticComment(item: CommentItem): boolean {
  return typeof item.value?.id === "string" && item.value.id.startsWith("temp-");
}

/**
 * Inserts an acknowledgement between comments by timestamp, while keeping
 * in-flight optimistic comments pinned after the acknowledgement. That avoids
 * the ack row jumping when a temp comment's client timestamp would otherwise
 * place it before the acknowledgement.
 */
export function insertAcknowledgement(
  comments: CommentItem[],
  acknowledgedAt: string,
  acknowledgingPerson: CommentItem["value"],
): CommentItem[] {
  const pending = comments.filter(isOptimisticComment);
  const confirmed = comments.filter((comment) => !isOptimisticComment(comment));
  const { before, after } = splitComments(confirmed, acknowledgedAt);

  const acknowledgement: CommentItem = {
    type: "acknowledgement",
    insertedAt: Time.parse(acknowledgedAt)!,
    value: acknowledgingPerson,
  };

  return [...before, acknowledgement, ...after, ...pending];
}

export function parseCommentContent(content: string | null | undefined) {
  if (!content || content.trim() === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(content);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    if (Object.keys(parsed).length === 0) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse comment content:", error);
    return null;
  }
}

export function stringifyCommentContent(content: unknown) {
  return JSON.stringify(content ?? {});
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
  };
}
