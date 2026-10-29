import i18n from "../i18n";
import { useTranslation } from "react-i18next";
import React, { useCallback, useState } from "react";
import { Link } from "react-router";
import { Avatar } from "../Avatar";
import { Menu, MenuActionItem } from "../Menu";
import { FormattedTime } from "../FormattedTime";
import RichContent from "../RichContent";
import { parseContent } from "../RichContent/contentOps";
import { IconEdit, IconTrash, IconLink, IconDotsVertical } from "../icons";
import { CommentAppearance, CommentItemProps } from "./types";
import { compareIds } from "../utils/ids";
import { Editor, useEditor, MentionedPersonLookupFn } from "../RichEditor";
import { PrimaryButton, SecondaryButton } from "../Button";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { createTestId } from "../TestableElement";
import { Reactions } from "../Reactions";
import { useScrollIntoViewOnLoad } from "../utils/useScrollIntoViewOnLoad";
import { showErrorToast, showSuccessToast } from "../Toasts";
import type { TaskListInteraction } from "../RichEditor/taskLists";
import { useCommentVisibility } from "./useCommentVisibility";

function shortName(name: string | undefined): string {
  if (!name) return "";
  const firstPart = name.split(" ")[0];
  return firstPart || "";
}

function BlackLink({
  to,
  underline,
  children,
}: {
  to: string;
  underline: "hover" | "none";
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className={`text-content-accent ${underline === "hover" ? "hover:underline" : ""}`}>
      {children}
    </Link>
  );
}

export function CommentItem({
  comment,
  canComment,
  currentUserId,
  form,
  richTextHandlers,
  onAddReaction,
  onRemoveReaction,
  formattedTimePreferences,
  appearance = "card",
  onVisible,
  canManageComments = false,
  initiallyEditing = false,
}: CommentItemProps) {
  const isInline = appearance === "inline";
  const [isEditing, setIsEditing] = useState(initiallyEditing);
  const parsedContent = parseContent(comment.content);
  const onTaskItemChange = richTextHandlers.onCommentTaskItemChange;
  const isOwnComment = compareIds(currentUserId, comment.author.id);
  const visibilityRef = useCommentVisibility(onVisible, comment.id);

  useScrollIntoViewOnLoad(comment.id);

  const canAddReaction = Boolean(canComment && onAddReaction);

  const handleSaveEdit = async (content: any) => {
    if (isInline && form.submitting) return false;
    if (form && form.editComment) {
      const success = await form.editComment(comment.id, content);
      if (success === false) return isInline ? false : undefined;

      setIsEditing(false);
    }
    return undefined;
  };

  const handleAddReaction = useCallback(
    (emoji: string) => {
      if (onAddReaction) {
        return onAddReaction(comment.id, emoji);
      }
    },
    [onAddReaction, comment.id],
  );

  const handleRemoveReaction = useCallback(
    (reactionId: string) => {
      if (onRemoveReaction) {
        return onRemoveReaction(comment.id, reactionId);
      }
    },
    [onRemoveReaction, comment.id],
  );

  const testId = "comment-" + comment.id;
  const isFlat = appearance !== "card";
  const displayName = isFlat ? comment.author.fullName : shortName(comment.author.fullName);
  const containerClassName = isFlat
    ? "flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent relative"
    : "flex items-start gap-3 py-4 not-first:border-t border-stroke-base text-content-accent relative bg-surface-dimmed rounded-lg px-4 my-2";

  const author = (
    <div className="font-bold -mt-0.5">
      {!isFlat && comment.author.profileLink ? (
        <BlackLink to={comment.author.profileLink} underline="hover">
          {displayName}
        </BlackLink>
      ) : (
        displayName
      )}
    </div>
  );
  const timestamp = (
    <span className={isInline ? "text-content-dimmed text-xs" : "text-content-dimmed text-sm"}>
      <FormattedTime {...formattedTimePreferences} time={comment.insertedAt} format="relative" />
    </span>
  );
  const menu = !isEditing && (
    <CommentMenu
      comment={comment}
      canEdit={canComment && (!isInline || !form.submitting) && (canManageComments || isOwnComment)}
      appearance={appearance}
      onEdit={() => setIsEditing(true)}
      onDelete={form.deleteComment ? () => form.deleteComment?.(comment.id) : undefined}
    />
  );

  return (
    <div
      className={isInline ? `group/comment ${containerClassName}` : containerClassName}
      data-test-id={testId}
      id={comment.id}
      ref={visibilityRef}
    >
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="min-w-0 flex-1">
        <div className={isInline ? "flex items-start justify-between gap-2" : "flex items-center justify-between"}>
          {isInline ? (
            <div className="min-w-0">
              {author}
              {timestamp}
            </div>
          ) : (
            author
          )}
          <div className={isInline ? "flex items-center gap-2 shrink-0" : "flex items-center gap-2"}>
            {!isInline && timestamp}
            {isInline ? (
              <div className="flex items-center opacity-0 pointer-events-none group-hover/comment:opacity-100 group-hover/comment:pointer-events-auto group-focus-within/comment:opacity-100 group-focus-within/comment:pointer-events-auto [&:has([data-state=open])]:opacity-100 [&:has([data-state=open])]:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto">
                {menu}
              </div>
            ) : (
              menu
            )}
          </div>
        </div>

        {isEditing ? (
          <CommentEditMode
            inline={isInline}
            content={parsedContent}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
            richTextHandlers={richTextHandlers}
            localDraftKey={form.editCommentDraftKey?.(comment.id)}
          />
        ) : (
          <CommentViewMode
            content={parsedContent}
            taskList={
              onTaskItemChange
                ? {
                    canEdit: canComment && (canManageComments || isOwnComment),
                    onChange: (change) => onTaskItemChange(comment.id, change),
                  }
                : { canEdit: false }
            }
            mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
            reactions={comment.reactions}
            currentUserId={currentUserId}
            canAddReaction={canAddReaction}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
          />
        )}
      </div>
    </div>
  );
}

interface CommentMenuProps {
  comment: CommentItemProps["comment"];
  canEdit: boolean;
  appearance: CommentAppearance;
  onEdit: () => void;
  onDelete?: () => void | Promise<void>;
}

export function CommentMenu({ comment, canEdit, appearance, onEdit, onDelete }: CommentMenuProps) {
  const { t } = useTranslation();
  const deleting = React.useRef(false);
  const handleDelete = async () => {
    if (appearance === "inline" && deleting.current) return;
    deleting.current = true;
    try {
      await onDelete?.();
    } catch {
      showErrorToast(t("Comment not deleted"), t("Please try again."));
    } finally {
      deleting.current = false;
    }
  };

  const handleCopyLink = useCallback(async () => {
    try {
      const url = new URL(window.location.href);
      url.hash = comment.id;
      await navigator.clipboard.writeText(url.toString());
      showSuccessToast(i18n.t("Success"), i18n.t("The comment link has been copied to your clipboard"));
    } catch (err) {
      showErrorToast(i18n.t("Unexpected error"), i18n.t("Failed to copy comment link to clipboard"));
    }
  }, [comment.id]);

  const isFlat = appearance !== "card";

  if (appearance === "inline" && !canEdit) return null;

  return (
    <Menu
      size="small"
      ariaLabel={appearance === "inline" ? t("Options") : undefined}
      triggerIcon={appearance === "inline" ? IconDotsVertical : undefined}
      testId={isFlat ? "comment-options" : createTestId("comment-menu", comment.id)}
    >
      {appearance !== "inline" && (
        <MenuActionItem
          onClick={handleCopyLink}
          icon={IconLink}
          testId={isFlat ? "copy-comment-link" : createTestId("copy-link", comment.id)}
        >
          {t("Copy link")}
        </MenuActionItem>
      )}
      {canEdit && (
        <>
          <MenuActionItem
            onClick={onEdit}
            icon={IconEdit}
            testId={isFlat ? "edit-comment" : createTestId("edit", comment.id)}
          >
            {t("Edit")}
          </MenuActionItem>
          {onDelete && (
            <MenuActionItem
              onClick={handleDelete}
              icon={IconTrash}
              danger
              testId={isFlat ? "delete-comment" : createTestId("delete", comment.id)}
            >
              {t("Delete")}
            </MenuActionItem>
          )}
        </>
      )}
    </Menu>
  );
}

interface CommentViewModeProps {
  content: any;
  taskList: TaskListInteraction;
  mentionedPersonLookup: MentionedPersonLookupFn;
  reactions: Reactions.Reaction[];
  currentUserId?: string;
  canAddReaction: boolean;
  onAddReaction?: (emoji: string) => void | Promise<void>;
  onRemoveReaction?: (reactionId: string) => void | Promise<void>;
}

function CommentViewMode({
  content,
  taskList,
  mentionedPersonLookup,
  reactions,
  currentUserId,
  canAddReaction,
  onAddReaction,
  onRemoveReaction,
}: CommentViewModeProps) {
  const shouldShowReactions = reactions.length > 0 || canAddReaction;

  return (
    <div>
      <div className="mb-2">
        <RichContent content={content} mentionedPersonLookup={mentionedPersonLookup} taskList={taskList} />
      </div>
      {shouldShowReactions && (
        <Reactions
          reactions={reactions}
          size={20}
          canAddReaction={canAddReaction}
          currentPersonId={currentUserId}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
        />
      )}
    </div>
  );
}

interface CommentEditModeProps {
  inline?: boolean;
  content: any;
  onSave: (content: any) => Promise<boolean | void> | boolean | void;
  onCancel: () => void;
  richTextHandlers: RichEditorHandlers;
  localDraftKey?: string;
}

function CommentEditMode({
  content,
  onSave,
  onCancel,
  richTextHandlers,
  localDraftKey,
  inline = false,
}: CommentEditModeProps) {
  const { t } = useTranslation();
  const saving = React.useRef(false);
  const [pending, setPending] = useState(false);
  const editor = useEditor({
    content: content,
    editable: true,
    placeholder: t("Edit your comment..."),
    handlers: richTextHandlers,
    localDraft: { key: localDraftKey },
  });

  const handleSave = async () => {
    const updatedContent = editor.getJson();
    if (!updatedContent || editor.empty) return;
    if (!inline) {
      const success = await onSave(updatedContent);
      if (success !== false) editor.clearLocalDraft();
      return;
    }
    if (saving.current) return;
    saving.current = true;
    setPending(true);
    try {
      if ((await onSave(updatedContent)) !== false) editor.clearLocalDraft();
    } catch {
      showErrorToast(t("Comment not updated"), t("Your draft has been kept for retry."));
    } finally {
      saving.current = false;
      setPending(false);
    }
  };

  const handleCancel = () => {
    editor.clearLocalDraft();
    onCancel();
  };

  return (
    <div className="bg-surface-base rounded-lg border border-stroke-base p-2 mt-1" data-test-id="edit-comment-form">
      <Editor editor={editor} hideBorder hideToolbar={inline} />
      <div className="flex gap-2 p-2 mt-2">
        <PrimaryButton
          size="xs"
          onClick={handleSave}
          disabled={editor.empty || pending}
          loading={inline ? pending : undefined}
          testId="post-comment"
        >
          {t("Save Changes")}
        </PrimaryButton>
        <SecondaryButton size="xs" onClick={handleCancel} disabled={inline ? pending : undefined}>
          {t("Cancel")}
        </SecondaryButton>
      </div>
    </div>
  );
}
