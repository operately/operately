import * as Comments from "@/models/comments";
import * as People from "@/models/people";
import * as ReactionsModel from "@/models/reactions";
import { type Paths } from "@/routes/paths";
import { type Comment, type CommentSectionItem } from "turboui";

export function mapCommentSectionItems(paths: Paths, items: Comments.CommentItem[]): CommentSectionItem[] {
  return items.map((item) => {
    switch (item.type) {
      case "comment":
        return { type: "comment", value: mapCommentForTurboUi(paths, item.value) };

      case "acknowledgement": {
        const person = People.parsePersonForTurboUi(paths, item.value);
        if (!person) {
          throw new Error("Acknowledgement person is required");
        }

        return {
          type: "acknowledgment",
          value: person,
          insertedAt: toIsoString(item.insertedAt),
        };
      }

      case "milestone-completed":
      case "milestone-reopened": {
        const author = People.parsePersonForTurboUi(paths, item.value.author);
        if (!author) {
          throw new Error("Milestone activity author is required");
        }

        return {
          type: item.type,
          value: {
            id: item.value.id,
            type: item.type,
            author,
            insertedAt: toIsoString(item.value.insertedAt ?? item.insertedAt),
          },
        };
      }

      default:
        throw new Error(`Unknown comment feed item type: ${(item as Comments.CommentItem).type}`);
    }
  });
}

function mapCommentForTurboUi(paths: Paths, comment: Comments.Comment): Comment {
  const author = People.parsePersonForTurboUi(paths, comment.author);
  if (!author || !comment.id || !comment.insertedAt) {
    throw new Error("Comment author, id, and insertedAt are required");
  }

  return {
    id: comment.id,
    content: comment.content || "{}",
    author,
    insertedAt: comment.insertedAt,
    reactions: ReactionsModel.parseReactionsForTurboUi(paths, comment.reactions),
    notification: comment.notification,
  };
}

function toIsoString(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}
