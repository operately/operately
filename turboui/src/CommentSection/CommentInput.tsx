import type { JSONContent } from "@tiptap/core";
import i18n, { tn } from "../i18n";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Avatar, AvatarList } from "../Avatar";
import type { AvatarPerson } from "../Avatar";
import { shortName } from "../Avatar/AvatarWithName";
import { PrimaryButton, SecondaryButton } from "../Button";
import { CommentInputProps, CommentNotificationInfo, Person } from "./types";
import { Editor, useEditor } from "../RichEditor";
import { showErrorToast } from "../Toasts";
import { useDraftActivatedInput } from "./useDraftActivatedInput";

interface CommentInputActiveProps extends CommentInputProps {
  currentUser: Person;
  onBlur: () => void;
  onPost: (content: JSONContent) => Promise<void>;
  restoredContent?: JSONContent;
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
  const { t } = useTranslation();
  const { active, activate, deactivate } = useDraftActivatedInput(form.commentDraftKey);
  const composerVersion = React.useRef(0);
  const [restoredContent, setRestoredContent] = useState<JSONContent>();
  const mounted = React.useRef(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const startComment = () => {
    composerVersion.current += 1;
    activate();
  };

  const closeInput = () => {
    setRestoredContent(undefined);
    deactivate();
  };

  const postComment = async (content: JSONContent) => {
    const submittedVersion = composerVersion.current;
    // Close before the host adds its optimistic row; keep recovery outside the unmounted editor.
    closeInput();
    try {
      if ((await form.postComment(content)) !== false) return;
    } catch {
      // Handle false results and rejected requests the same way below.
    }

    if (!mounted.current) return;

    // Starting another comment discards recovery of this one, even if the newer comment was cancelled.
    if (composerVersion.current !== submittedVersion) {
      showErrorToast(t("Comment not posted"), t("Please try again."));
      return;
    }

    setRestoredContent(content);
    startComment();
    showErrorToast(t("Comment not posted"), t("Your draft has been kept for retry."));
  };

  if (active) {
    return (
      <CommentInputActive
        key={composerVersion.current}
        form={form}
        currentUser={currentUser}
        onBlur={closeInput}
        onPost={postComment}
        restoredContent={restoredContent}
        richTextHandlers={richTextHandlers}
        notificationInfo={notificationInfo}
      />
    );
  }

  return <CommentInputInactive currentUser={currentUser} onClick={startComment} />;
}

function CommentInputInactive({ currentUser, onClick }: CommentInputInactiveProps) {
  const { t } = useTranslation();
  return (
    <div
      className="py-4 sm:py-6 not-first:border-t border-stroke-base cursor-pointer flex items-center gap-3"
      data-test-id="add-comment"
      onClick={onClick}
    >
      <Avatar person={currentUser} size="normal" />
      {t("Write a comment here...")}
    </div>
  );
}

function CommentInputActive({
  form,
  currentUser,
  onBlur,
  onPost,
  restoredContent,
  richTextHandlers,
  notificationInfo,
}: CommentInputActiveProps) {
  const { t } = useTranslation();
  const [uploading] = useState(false);
  const restoreOnMount = React.useRef(restoredContent);

  const editor = useEditor({
    content: "",
    editable: true,
    placeholder: t("Write a comment here..."),
    handlers: richTextHandlers,
    autoFocus: true,
    className: "min-h-[200px] px-4 py-3",
    localDraft: { key: form.commentDraftKey },
  });

  React.useEffect(() => {
    if (!editor.editor || !restoreOnMount.current) return;
    // Emit an update so the restored content is also saved by the normal local-draft handler.
    editor.editor.commands.setContent(restoreOnMount.current, { emitUpdate: true });
    restoreOnMount.current = undefined;
  }, [editor.editor]);

  const handlePost = () => {
    const content = editor.getJson();
    if (!content || editor.empty || uploading || form.submitting) return;

    editor.clearLocalDraft();
    void onPost(content);
  };

  const handleCancel = () => {
    editor.clearLocalDraft();
    onBlur();
  };

  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [handleCancel]);

  return (
    <div className="py-6 not-first:border-t border-stroke-base flex items-start gap-3" data-test-id="new-comment-form">
      <Avatar person={currentUser} size="normal" />
      <div className="flex-1 min-w-0">
        <div className="border border-surface-outline rounded-lg overflow-hidden">
          <Editor editor={editor} hideBorder padding="p-0" />

          <div className="flex justify-between items-center m-4">
            <div className="flex items-center gap-2">
              <PrimaryButton
                size="xs"
                onClick={handlePost}
                loading={form.submitting || uploading}
                disabled={editor.empty}
                testId="post-comment"
              >
                {uploading ? t("Uploading...") : t("Post")}
              </PrimaryButton>

              <SecondaryButton size="xs" onClick={handleCancel}>
                {t("Cancel")}
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
  const { t } = useTranslation();
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
                {showAllRecipients ? t("Hide list") : t("View all")}
              </button>
            )}
          </div>
          {showAllRecipients && recipientSummary.allNames.length > 0 && (
            <div className="text-xs text-content-dimmed mt-1">{recipientSummary.allNames.join(", ")}</div>
          )}
          {!info.isCurrentUserSubscribed && subscribedPeople.length > 0 && (
            <div className="text-xs text-content-dimmed mt-1">{t("Tip: Subscribe if you want notifications too.")}</div>
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

  if (names.length === 0) {
    return {
      message:
        entityLabel === "task"
          ? i18n.t("Tip: @-mention someone to notify them about this task.")
          : i18n.t("Tip: @-mention someone to notify them about this milestone."),
      allNames: [],
      hasHiddenRecipients: false,
    };
  }

  if (names.length === 1) {
    return {
      message: withSentencePeriod(i18n.t("This comment will notify {{name}}", { name: names[0] })),
      allNames: names,
      hasHiddenRecipients: false,
    };
  }

  if (names.length === 2) {
    return {
      message: withSentencePeriod(
        i18n.t("This comment will notify {{first}} and {{second}}", {
          first: names[0],
          second: names[1],
        }),
      ),
      allNames: names,
      hasHiddenRecipients: false,
    };
  }

  const remainingCount = names.length - 2;
  return {
    message: tn(
      "This comment will notify {{first}}, {{second}}, and 1 other.",
      "This comment will notify {{first}}, {{second}}, and {{count}} others.",
      remainingCount,
      { first: names[0], second: names[1] },
    ),
    allNames: names,
    hasHiddenRecipients: true,
  };
}

function withSentencePeriod(message: string) {
  return message.endsWith(".") ? message : `${message}.`;
}
