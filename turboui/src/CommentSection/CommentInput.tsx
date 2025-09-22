import React, { useState } from "react";
import { Avatar } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { CommentInputProps, Person } from "./types";
import { Editor, useEditor } from "../RichEditor";

interface CommentInputActiveProps extends CommentInputProps {
  currentUser: Person;
  onBlur: () => void;
  onPost: () => void;
}

interface CommentInputInactiveProps {
  currentUser: Person;
  onClick: () => void;
}

export function CommentInput({
  form,
  currentUser,
  richTextHandlers,
}: CommentInputProps & { currentUser: Person }) {
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
        richTextHandlers={richTextHandlers}
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
      <Avatar person={currentUser} size="normal" />
      <span className="text-content-dimmed ml-2">Write a comment here...</span>
    </div>
  );
}

function CommentInputActive({
  form,
  currentUser,
  onBlur,
  onPost,
  richTextHandlers,
}: CommentInputActiveProps) {
  const [uploading] = useState(false);

  const editor = useEditor({
    content: "",
    editable: true,
    placeholder: "Write a comment here...",
    handlers: richTextHandlers,
  });

  const handlePost = async () => {
    const content = editor.getJson();
    if (!content || editor.empty) return;
    if (uploading) return;

    try {
      form.postComment(content);
      editor.setContent("");
      onPost();
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBlur();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onBlur]);

  return (
    <div className="py-6 not-first:border-t border-stroke-base flex items-start gap-3">
      <Avatar person={currentUser} size="normal" />
      <div className="flex-1">
        <div className="border border-surface-outline rounded-lg overflow-hidden">
          <Editor editor={editor} hideBorder />

          <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-2">
              <PrimaryButton
                size="xs"
                onClick={handlePost}
                loading={form.submitting || uploading}
                disabled={editor.empty}
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
