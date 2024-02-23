import type { Comment } from "./index";
import * as Time from "@/utils/time";

export function splitComments(comments: Comment[], timestamp: string): { before: Comment[]; after: Comment[] } {
  const before = comments.filter((comment) => {
    return Time.parse(comment.insertedAt)! < Time.parse(timestamp)!;
  });

  const after = comments.filter((comment) => {
    return Time.parse(comment.insertedAt)! >= Time.parse(timestamp)!;
  });

  return { before, after };
}
