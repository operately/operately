import React, { useState } from "react";
import { Avatar, AvatarList } from "../Avatar";
import type { AvatarPerson } from "../Avatar";
import { shortName } from "../Avatar/AvatarWithName";
import { PrimaryButton, SecondaryButton } from "../Button";
import { CommentInputProps, CommentNotificationInfo, Person } from "./types";
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
  notificationInfo,
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
        notificationInfo={notificationInfo}
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
  notificationInfo,
}: CommentInputActiveProps) {
  const [uploading] = useState(false);

  const editor = useEditor({
    content: "",
    editable: true,
    placeholder: "Write a comment here...",
    handlers: richTextHandlers,
    autoFocus: true,
    className: "min-h-[200px] px-4 py-3",
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
    <div className="py-6 not-first:border-t border-stroke-base flex items-start gap-3" data-test-id="new-comment-form">
      <Avatar person={currentUser} size="normal" />
      <div className="flex-1">
        <div className="border border-surface-outline rounded-lg overflow-hidden">
          <Editor editor={editor} hideBorder padding="p-0" />

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

          {notificationInfo && <CommentNotificationSummary info={notificationInfo} />}
        </div>
      </div>
    </div>
  );
}

function CommentNotificationSummary({ info }: { info: CommentNotificationInfo }) {
  const subscribedPeople = (info.subscribedPeople ?? []).filter((person) => person.id !== info.currentUserId);
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const recipientSummary = buildRecipientSummary(subscribedPeople, info.entityLabel);

  return (
    <div className="border-t border-surface-outline px-4 py-3 bg-surface-dimmed/40">
      <div className="flex items-center gap-3">
        <AvatarList people={subscribedPeople} size="tiny" stacked maxElements={6} wrap={false} />
        <div className="min-w-0">
          <div className="text-xs text-content-base flex flex-wrap items-center gap-x-1 gap-y-1">
            <span>{recipientSummary.message}</span>
            {recipientSummary.hasHiddenRecipients && (
              <button
                type="button"
                className="text-content-link hover:underline"
                onClick={() => setShowAllRecipients((prev) => !prev)}
              >
                {showAllRecipients ? "Hide list" : "View all"}
              </button>
            )}
          </div>
          {showAllRecipients && recipientSummary.allNames.length > 0 && (
            <div className="text-xs text-content-dimmed mt-1">{recipientSummary.allNames.join(", ")}</div>
          )}
          {!info.isCurrentUserSubscribed && subscribedPeople.length > 0 && (
            <div className="text-xs text-content-dimmed mt-1">Tip: Subscribe if you want notifications too.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildRecipientSummary(people: AvatarPerson[], entityLabel: "task" | "milestone") {
  const names = people
    .map((person) => (person.fullName ? shortName(person.fullName) : null))
    .filter(Boolean) as string[];

  if (people.length === 0) {
    return {
      message: `Tip: @-mention someone to notify them about this ${entityLabel}.`,
      allNames: [],
      hasHiddenRecipients: false,
    };
  }

  if (names.length === 1) {
    return {
      message: withSentencePeriod(`This comment will notify ${names[0]}`),
      allNames: names,
      hasHiddenRecipients: false,
    };
  }

  if (names.length === 2) {
    return {
      message: withSentencePeriod(`This comment will notify ${names[0]} and ${names[1]}`),
      allNames: names,
      hasHiddenRecipients: false,
    };
  }

  const remainingCount = names.length - 2;
  return {
    message: withSentencePeriod(
      `This comment will notify ${names[0]}, ${names[1]}, and ${remainingCount} other${remainingCount === 1 ? "" : "s"}`,
    ),
    allNames: names,
    hasHiddenRecipients: true,
  };
}

function withSentencePeriod(text: string) {
  return text.endsWith(".") ? text : `${text}.`;
}
