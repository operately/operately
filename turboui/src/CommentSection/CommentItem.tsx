import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../Avatar";
import { Menu, MenuActionItem } from "../Menu";
import { FormattedTime } from "../FormattedTime";
import RichContent from "../RichContent";
import { IconEdit, IconTrash } from "../icons";
import { CommentItemProps } from "./types";
import { compareIds } from "../utils/ids";
import { Editor, useEditor, MentionedPersonLookupFn } from "../RichEditor";
import { PrimaryButton, SecondaryButton } from "../Button";
import { RichEditorHandlers } from "../RichEditor/useEditor";
import { createTestId } from "../TestableElement";
import { Reactions } from "../Reactions";

// Function to shorten name for display
function shortName(name: string | undefined): string {
  if (!name) return "";
  const firstPart = name.split(" ")[0];
  return firstPart || "";
}

// BlackLink component for consistent styling
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
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const parsedContent = JSON.parse(comment.content)["message"];
  const isOwnComment = compareIds(currentUserId, comment.author.id);

  const canAddReaction = Boolean(canComment && onAddReaction);

  const handleSaveEdit = (content: any) => {
    if (form && form.editComment) {
      form.editComment(comment.id, content);
      setIsEditing(false);
    }
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

  return (
    <div
      className="flex items-start gap-3 py-4 not-first:border-t border-stroke-base text-content-accent relative bg-surface-dimmed rounded-lg px-4 my-2"
      id={comment.id}
    >
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="font-bold -mt-0.5">
            {comment.author.profileLink ? (
              <BlackLink to={comment.author.profileLink} underline="hover">
                {shortName(comment.author.fullName)}
              </BlackLink>
            ) : (
              shortName(comment.author.fullName)
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>

            {isOwnComment && !isEditing && (
              <Menu size="small" testId={createTestId("comment-menu", comment.id)}>
                <MenuActionItem
                  onClick={() => setIsEditing(true)}
                  icon={IconEdit}
                  testId={createTestId("edit", comment.id)}
                >
                  Edit
                </MenuActionItem>
                {form.deleteComment && (
                  <MenuActionItem
                    onClick={() => form.deleteComment?.(comment.id)}
                    icon={IconTrash}
                    danger
                    testId={createTestId("delete", comment.id)}
                  >
                    Delete
                  </MenuActionItem>
                )}
              </Menu>
            )}
          </div>
        </div>

        {isEditing ? (
          <CommentEditMode
            content={parsedContent}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
            richTextHandlers={richTextHandlers}
          />
        ) : (
          <CommentViewMode
            content={parsedContent}
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

interface CommentViewModeProps {
  content: any;
  mentionedPersonLookup: MentionedPersonLookupFn;
  reactions: Reactions.Reaction[];
  currentUserId?: string;
  canAddReaction: boolean;
  onAddReaction?: (emoji: string) => void | Promise<void>;
  onRemoveReaction?: (reactionId: string) => void | Promise<void>;
}

function CommentViewMode({
  content,
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
        <RichContent content={content} mentionedPersonLookup={mentionedPersonLookup} />
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
  content: any;
  onSave: (content: any) => void;
  onCancel: () => void;
  richTextHandlers: RichEditorHandlers;
}

function CommentEditMode({ content, onSave, onCancel, richTextHandlers }: CommentEditModeProps) {
  const editor = useEditor({
    content: content,
    editable: true,
    placeholder: "Edit your comment...",
    handlers: richTextHandlers,
  });

  const handleSave = () => {
    const updatedContent = editor.getJson();
    if (!updatedContent || editor.empty) return;
    onSave(updatedContent);
  };

  return (
    <div className="bg-surface-base rounded-lg border border-stroke-base p-2 mt-1" data-test-id="edit-comment-form">
      <Editor editor={editor} hideBorder />
      <div className="flex gap-2 p-2 mt-2">
        <PrimaryButton size="xs" onClick={handleSave} disabled={editor.empty}>
          Save
        </PrimaryButton>
        <SecondaryButton size="xs" onClick={onCancel}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}
