import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../Avatar";
import { Menu, MenuActionItem } from "../Menu";
import { FormattedTime } from "../FormattedTime";
import RichContent from "../RichContent";
import { IconEdit } from "../icons";
import { CommentItemProps } from "./types";
import { compareIds } from "../utils/ids";
import { Editor, useEditor, MentionedPersonLookupFn } from "../RichEditor";
import { PrimaryButton, SecondaryButton } from "../Button";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";

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
  mentionedPersonLookup,
  peopleSearch,
  form,
}: CommentItemProps & { currentUserId?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const parsedContent = JSON.parse(comment.content)["message"];
  const isOwnComment = compareIds(currentUserId, comment.author.id);

  const handleSaveEdit = (content: any) => {
    if (form && form.editComment) {
      form.editComment(comment.id, content);
      setIsEditing(false);
    }
  };

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
              <Menu size="small">
                <MenuActionItem onClick={() => setIsEditing(true)} icon={IconEdit}>
                  Edit
                </MenuActionItem>
              </Menu>
            )}
          </div>
        </div>

        {isEditing ? (
          <CommentEditMode
            content={parsedContent}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
            mentionedPersonLookup={mentionedPersonLookup}
            peopleSearch={peopleSearch}
          />
        ) : (
          <CommentViewMode
            content={parsedContent}
            mentionedPersonLookup={mentionedPersonLookup}
            reactions={comment.reactions}
            canComment={canComment}
          />
        )}
      </div>
    </div>
  );
}

interface CommentViewModeProps {
  content: any;
  mentionedPersonLookup?: MentionedPersonLookupFn;
  reactions: any[];
  canComment: boolean;
}

function CommentViewMode({ content, mentionedPersonLookup, reactions, canComment }: CommentViewModeProps) {
  return (
    <div>
      <div className="mb-2">
        <RichContent content={content} mentionedPersonLookup={mentionedPersonLookup} />
      </div>
      {canComment && false && <ReactionList reactions={reactions} />}
    </div>
  );
}

interface CommentEditModeProps {
  content: any;
  onSave: (content: any) => void;
  onCancel: () => void;
  mentionedPersonLookup?: MentionedPersonLookupFn;
  peopleSearch?: SearchFn;
}

function CommentEditMode({ content, onSave, onCancel, mentionedPersonLookup, peopleSearch }: CommentEditModeProps) {
  const editor = useEditor({
    content: content,
    editable: true,
    placeholder: "Edit your comment...",
    mentionedPersonLookup: mentionedPersonLookup,
    peopleSearch: peopleSearch,
  });

  const handleSave = () => {
    const updatedContent = editor.getJson();
    if (!updatedContent || editor.empty) return;
    onSave(updatedContent);
  };

  return (
    <div className="bg-surface-base rounded-lg border border-stroke-base p-2 mt-1">
      <Editor editor={editor} hideBorder hideToolbar />
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

function ReactionList({ reactions }: { reactions: any[] }) {
  // This should integrate with the actual reaction system
  return <div>Reactions: {reactions.length}</div>;
}
