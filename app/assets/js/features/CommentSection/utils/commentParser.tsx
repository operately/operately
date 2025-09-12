import * as Comments from "@/models/comments";
import { parse } from "@/utils/time";

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
