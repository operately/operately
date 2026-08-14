import React from "react";

import Api, { type ProjectTemplateComment } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import * as People from "@/models/people";
import { stringifyCommentContent } from "@/models/comments";
import { usePaths } from "@/routes/paths";
import {
  showErrorToast,
  type CommentSectionItem,
  type CommentSectionProps,
  type FormattedTimePreferences,
  type RichEditorHandlers,
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
  richTextHandlers: RichEditorHandlers;
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
  const [items, setItems] = React.useState<CommentSectionItem[]>(() => mapComments(paths, comments));

  React.useEffect(() => {
    setItems((current) => [...mapComments(paths, comments), ...current.filter(isOptimisticItem)]);
  }, [comments, paths]);

  const canComment = canEdit;

  return {
    items,
    currentUser,
    canComment,
    canManageComments: canComment,
    onAddComment: async (content) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: CommentSectionItem = {
        type: "comment",
        value: {
          id: tempId,
          content: stringifyCommentContent(content),
          author: currentUser,
          insertedAt: new Date().toISOString(),
          reactions: [],
        },
      };

      setItems((current) => [...current, optimisticItem]);

      try {
        const result = await Api.project_templates.createComment({
          templateId,
          parentType,
          parentId,
          content: stringifyCommentContent(content),
        });
        const saved = toItem(paths, result.comment);

        setItems((current) => {
          if (current.some((item) => item.type === "comment" && item.value.id === saved.value.id)) {
            return current.filter((item) => !isItem(item, tempId));
          }

          return current.map((item) => (isItem(item, tempId) ? saved : item));
        });

        return true;
      } catch {
        setItems((current) => current.filter((item) => !isItem(item, tempId)));
        showErrorToast("Comment not added", "The comment was not saved. Try again.");
        return false;
      }
    },
    onEditComment: async (id, content) => {
      try {
        const result = await Api.project_templates.updateComment({
          templateId,
          commentId: id,
          content: stringifyCommentContent(content),
        });

        setItems((current) => current.map((item) => (item.type === "comment" && item.value.id === id ? toItem(paths, result.comment) : item)));
        return true;
      } catch {
        showErrorToast("Comment not updated", "The comment was not saved. Try again.");
        return false;
      }
    },
    onDeleteComment: canComment
      ? async (id) => {
          try {
            await Api.project_templates.deleteComment({ templateId, commentId: id });
            setItems((current) => current.filter((item) => !(item.type === "comment" && item.value.id === id)));
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

function isOptimisticItem(item: CommentSectionItem) {
  return item.type === "comment" && item.value.id.startsWith("temp-");
}

function isItem(item: CommentSectionItem, id: string) {
  return item.type === "comment" && item.value.id === id;
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
