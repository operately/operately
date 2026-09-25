import { type ProjectTemplateComment } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import * as People from "@/models/people";
import { stringifyCommentContent } from "@/models/comments";
import { usePaths } from "@/routes/paths";
import { useTemplateCommentMutations } from "./projectTemplateCommentLifecycle";
import {
  showErrorToast,
  type CommentSectionItem,
  type CommentSectionProps,
  type FormattedTimePreferences,
  type RichTextHandlers,
} from "turboui";

type TurboUiPerson = CommentSectionProps["currentUser"];

const UNKNOWN_AUTHOR: TurboUiPerson = {
  id: "unknown",
  fullName: "Unknown",
  avatarUrl: null,
  profileLink: "",
};

type TemplateCommentParentType = "discussion" | "document" | "file" | "link";

interface UseTemplateCommentsOptions {
  templateId: string;
  parentType: TemplateCommentParentType;
  parentId: string;
  comments: ProjectTemplateComment[];
  canEdit: boolean;
  richTextHandlers: RichTextHandlers;
  formattedTimePreferences: FormattedTimePreferences;
}

export function useTemplateComments({
  templateId,
  parentType,
  parentId,
  comments,
  canEdit,
  richTextHandlers,
  formattedTimePreferences,
}: UseTemplateCommentsOptions): CommentSectionProps {
  const me = useMe();
  const paths = usePaths();
  const currentUser = People.parsePersonForTurboUi(paths, me) ?? UNKNOWN_AUTHOR;
  const { create, update, remove } = useTemplateCommentMutations({ templateId, parentType, parentId });

  const canComment = canEdit;

  return {
    items: mapComments(paths, comments),
    currentUser,
    canComment,
    canManageComments: canComment,
    onAddComment: async (content) => {
      try {
        await create.mutateAsync({
          templateId,
          parentType,
          parentId,
          content: stringifyCommentContent(content),
        });
        return true;
      } catch {
        showErrorToast("Comment not added", "The comment was not saved. Try again.");
        return false;
      }
    },
    onEditComment: async (id, content) => {
      try {
        await update.mutateAsync({
          templateId,
          commentId: id,
          content: stringifyCommentContent(content),
        });

        return true;
      } catch {
        showErrorToast("Comment not updated", "The comment was not saved. Try again.");
        return false;
      }
    },
    onDeleteComment: canComment
      ? async (id) => {
          try {
            await remove.mutateAsync({ templateId, commentId: id });
          } catch {
            showErrorToast("Comment not deleted", "The comment is still on this page. Try again.");
          }
        }
      : undefined,
    richTextHandlers,
    formattedTimePreferences,
    commentDraftKey: `project-template-comment:${parentType}:${parentId}:new-comment`,
  };
}

function mapComments(paths: ReturnType<typeof usePaths>, comments: ProjectTemplateComment[]): CommentSectionItem[] {
  return comments.map((comment) => toItem(paths, comment));
}

function toItem(paths: ReturnType<typeof usePaths>, comment: ProjectTemplateComment): CommentSectionItem {
  return {
    type: "comment",
    value: {
      id: comment.id,
      content: comment.content || "{}",
      author: People.parsePersonForTurboUi(paths, comment.author) ?? UNKNOWN_AUTHOR,
      insertedAt: comment.insertedAt,
      reactions: [],
    },
  };
}
