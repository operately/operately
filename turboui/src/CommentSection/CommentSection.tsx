import React, { useState } from "react";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import { Avatar } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { MilestoneCompletedActivity, MilestoneReopenedActivity, AcknowledgmentActivity } from "./ActivityComponents";
import * as types from "./types";

export namespace CommentSection {
  export type Comment = types.Comment;

  export type CommentActivity = types.CommentActivity;
}

export function CommentSection({
  form,
  commentParentType,
  canComment,
  currentUser,
}: types.CommentSectionProps & { currentUser: types.Person }) {
  return (
    <div className="flex flex-col">
      {form.items.map((item, index) => {
        if (item.type === "comment") {
          return (
            <CommentWrapper
              key={`${item.type}-${index}`}
              comment={item.value}
              form={form}
              commentParentType={commentParentType}
              canComment={canComment}
              currentUser={currentUser}
            />
          );
        } else if (item.type === "milestone-completed") {
          return <MilestoneCompletedActivity key={`${item.type}-${index}`} activity={item.value} />;
        } else if (item.type === "milestone-reopened") {
          return <MilestoneReopenedActivity key={`${item.type}-${index}`} activity={item.value} />;
        } else if (item.type === "acknowledgment") {
          return <AcknowledgmentActivity key={`${item.type}-${index}`} person={item.value} ackAt={item.insertedAt} />;
        }
        return null;
      })}

      {canComment && <CommentInput form={form} currentUser={currentUser} />}
    </div>
  );
}

function CommentWrapper({
  comment,
  form,
  commentParentType,
  canComment,
  currentUser,
}: {
  comment: types.Comment;
  form: types.CommentSectionProps["form"];
  commentParentType: string;
  canComment: boolean;
  currentUser: types.Person;
}) {
  const [editing, setEditing] = useState(false);

  const handleEdit = () => setEditing(true);
  const handleCancelEdit = () => setEditing(false);

  const handleSaveEdit = (commentId: string, content: any) => {
    form.editComment(commentId, content);
    setEditing(false);
  };

  if (editing) {
    return (
      <EditingComment comment={comment} currentUser={currentUser} onCancel={handleCancelEdit} onSave={handleSaveEdit} />
    );
  }

  return (
    <CommentItem
      comment={comment}
      form={form}
      commentParentType={commentParentType}
      canComment={canComment}
      currentUserId={currentUser.id}
      onEdit={handleEdit}
    />
  );
}

interface EditingCommentProps {
  comment: types.Comment;
  currentUser: types.Person;
  onCancel: () => void;
  onSave: (commentId: string, content: any) => void;
}

function EditingComment({ comment, currentUser, onCancel, onSave }: EditingCommentProps) {
  const [content, setContent] = useState(() => {
    try {
      return JSON.parse(comment.content)["message"] || "";
    } catch {
      return "";
    }
  });
  const [uploading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    if (uploading) return;

    try {
      const editorContent = { message: content };
      onSave(comment.id, editorContent);
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  return (
    <div className="py-6 not-first:border-t border-stroke-base flex items-start gap-3">
      <Avatar person={currentUser} size="normal" />
      <div className="flex-1">
        <div className="border border-surface-outline rounded-lg overflow-hidden">
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[200px] resize-none border-none outline-none bg-transparent"
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-2">
              <PrimaryButton size="xs" onClick={handleSave} loading={uploading} disabled={!content.trim()}>
                {uploading ? "Uploading..." : "Save Changes"}
              </PrimaryButton>

              <SecondaryButton size="xs" onClick={onCancel}>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
