import { MilestoneComment } from "@/models/milestones";
import * as Comments from "@/models/comments";
import { parse } from "@/utils/time";
import { assertPresent } from "@/utils/assertions";

export function parseComments(comments?: Comments.Comment[] | null) {
  if (!comments) return [];
  return comments.map((comment) => parseComment(comment));
}

export function parseComment(comment: Comments.Comment) {
  return {
    type: "comment" as Comments.ItemType,
    insertedAt: parse(comment.insertedAt)!,
    value: comment,
  };
}

export function parseMilestoneComments(comments: MilestoneComment[]): Comments.CommentItem[] {
  return comments.map(({ action, comment }) => {
    assertPresent(comment, "comment must be present in commentMilestone");

    if (action === "none") {
      return { type: "comment" as Comments.ItemType, insertedAt: parse(comment.insertedAt)!, value: comment };
    }

    if (action === "complete") {
      return {
        type: "milestone-completed" as Comments.ItemType,
        insertedAt: parse(comment.insertedAt)!,
        value: comment,
      };
    }

    if (action === "reopen") {
      return {
        type: "milestone-reopened" as Comments.ItemType,
        insertedAt: parse(comment.insertedAt)!,
        value: comment,
      };
    }

    throw new Error("Invalid comment action " + action);
  });
}
