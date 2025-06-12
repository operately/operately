import React, { useState } from "react";
import { Avatar, AvatarWithName } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { CommentInputProps, Person } from "./types";

interface CommentInputActiveProps extends CommentInputProps {
  currentUser: Person;
  onBlur: () => void;
  onPost: () => void;
}

interface CommentInputInactiveProps {
  currentUser: Person;
  onClick: () => void;
}

export function CommentInput({ form, currentUser }: CommentInputProps & { currentUser: Person }) {
  const [active, setActive] = useState(false);

  const handleActivate = () => setActive(true);
  const handleDeactivate = () => setActive(false);

  if (active) {
    return (
      <CommentInputActive
        form={form}
        currentUser={currentUser}
        onBlur={handleDeactivate}
        onPost={handleDeactivate}
      />
    );
  }

  return <CommentInputInactive currentUser={currentUser} onClick={handleActivate} />;
}

function CommentInputInactive({ currentUser, onClick }: CommentInputInactiveProps) {
  return (
    <div
      className="py-4 sm:py-6 not-first:border-t border-stroke-base cursor-pointer flex items-center gap-3"
      onClick={onClick}
    >
      <AvatarWithName 
        person={currentUser} 
        size="normal" 
        nameFormat="short"
        link={currentUser.profileLink}
      />
      <span className="text-content-dimmed ml-2">Write a comment here...</span>
    </div>
  );
}

function CommentInputActive({ form, currentUser, onBlur, onPost }: CommentInputActiveProps) {
  const [content, setContent] = useState("");
  const [uploading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    if (uploading) return;

    try {
      // This would integrate with the actual rich text editor
      const editorContent = { message: content };
      form.postComment(editorContent);
      setContent("");
      onPost();
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onBlur();
    }
  };

  return (
    <div className="py-6 not-first:border-t border-stroke-base flex items-start gap-3">
      <Avatar person={currentUser} size="normal" />
      <div className="flex-1">
        <div className="border border-surface-outline rounded-lg overflow-hidden">
          {/* Placeholder for rich text editor */}
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment here..."
              className="w-full min-h-[200px] resize-none border-none outline-none bg-transparent"
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-2">
              <PrimaryButton
                size="xs"
                onClick={handlePost}
                loading={form.submitting || uploading}
                disabled={!content.trim()}
              >
                {uploading ? "Uploading..." : "Post"}
              </PrimaryButton>

              <SecondaryButton size="xs" onClick={onBlur}>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}