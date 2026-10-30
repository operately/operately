import React from "react";
import { useTranslation } from "react-i18next";
import type { InlineThread } from "../ApiTypes";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { Avatar } from "../Avatar";
import { FormattedTime } from "../FormattedTime";
import { parseContent, richContentToString } from "../RichContent/contentOps";
import { CommentInput, CommentItem, type Comment, type CommentFormState } from "../CommentSection";
import { CommentMenu } from "../CommentSection/CommentItem";
import { IconCheck, IconArrowBackUp } from "../icons";
import { compareIds } from "../utils/ids";
import { showErrorToast } from "../Toasts";
import { attachedRange, type DocumentInlineCommentsProps } from "./types";

export function Thread({
  thread,
  props,
  active,
  initiallyActiveReply,
  expanded = false,
  onSelect,
}: {
  thread: InlineThread;
  props: DocumentInlineCommentsProps;
  active: boolean;
  initiallyActiveReply: boolean;
  expanded?: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const showMessages = active || expanded;
  const cardRef = useThreadDismissal(active, props.onSelectThread);
  const [pending, setPending] = React.useState(false);
  const busy = React.useRef(false);
  const [editingFirstMessage, setEditingFirstMessage] = React.useState(false);
  React.useEffect(() => {
    if (!active) setEditingFirstMessage(false);
  }, [active]);

  const form = {
    items: [],
    submitting: pending || Boolean(props.pending),
    postComment: (content) => props.onReply(thread.id, content),
    editComment: props.onEditMessage,
    deleteComment: props.onDeleteMessage,
    commentDraftKey: `${props.draftKey}:reply:${thread.id}`,
    editCommentDraftKey: (id: string) => `${props.draftKey}:edit:${id}`,
  } satisfies CommentFormState;

  async function resolve() {
    if (busy.current || props.pending) return;
    busy.current = true;
    setPending(true);
    try {
      await props.onResolve(thread.id, !thread.resolvedAt);
    } catch {
      showErrorToast(t("Comment not updated"), t("Please try again."));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const comments: Comment[] = thread.messages.flatMap((message) => {
    if (!message.id || !message.author || !message.content || !message.insertedAt) return [];
    return [
      {
        id: message.id,
        content: message.content,
        insertedAt: message.insertedAt,
        reactions: [],
        author: { ...message.author, profileLink: props.getProfileLink(message.author.id) },
      },
    ];
  });
  const firstMessage = comments[0];

  return (
    <section
      ref={cardRef}
      className={`group/thread relative rounded-xl text-sm bg-surface-base ${showMessages ? "shadow-lg border border-stroke-base p-4" : ""}`}
      data-test-id={`inline-thread-${thread.id}`}
      data-resolved={Boolean(thread.resolvedAt)}
    >
      {!showMessages && <ThreadPreview thread={thread} props={props} firstMessage={firstMessage} onSelect={onSelect} />}

      {props.canComment && (
        <div className="absolute top-4 right-4 flex items-center opacity-0 pointer-events-none group-hover/thread:opacity-100 group-hover/thread:pointer-events-auto group-focus-within/thread:opacity-100 group-focus-within/thread:pointer-events-auto [&:has([data-state=open])]:opacity-100 [&:has([data-state=open])]:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto">
          <ResolveButton thread={thread} disabled={pending || props.pending} onResolve={resolve} />
          {!showMessages && firstMessage && (
            <CommentMenu
              comment={firstMessage}
              appearance="inline"
              canEdit={props.canComment && !props.pending && compareIds(props.currentUser.id, firstMessage.author.id)}
              editDisabled={Boolean(thread.resolvedAt)}
              onEdit={() => {
                setEditingFirstMessage(true);
                onSelect();
              }}
              onDelete={() => props.onDeleteMessage(firstMessage.id)}
            />
          )}
        </div>
      )}

      <div className={`text-xs text-content-dimmed flex flex-wrap gap-2 ${showMessages ? "" : "px-4 pb-2"}`}>
        {thread.resolvedAt && <span>{t("Resolved")}</span>}
        {!attachedRange(thread, props.documentVersion) && (
          <span data-test-id="inline-unattached">{t("This passage is no longer available.")}</span>
        )}
      </div>

      {showMessages && (
        <ThreadMessages
          thread={thread}
          props={props}
          comments={comments}
          form={form}
          editingFirstMessage={editingFirstMessage}
          initiallyActiveReply={initiallyActiveReply}
        />
      )}
    </section>
  );
}

function useThreadDismissal(active: boolean, onSelectThread: DocumentInlineCommentsProps["onSelectThread"]) {
  const cardRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (!active) return;

    const deactivateOutside = (event: PointerEvent) => {
      const card = cardRef.current;
      if (!card || !(event.target instanceof Node) || card.contains(event.target)) return;
      // Keep replies, message edits, and portalled menu actions open until finished.
      if (card.querySelector('[contenteditable="true"], [aria-busy="true"], [aria-haspopup="menu"][data-state="open"]'))
        return;
      onSelectThread(null);
    };

    document.addEventListener("pointerdown", deactivateOutside, true);
    return () => document.removeEventListener("pointerdown", deactivateOutside, true);
  }, [active, onSelectThread]);

  return cardRef;
}

interface ThreadPreviewProps {
  thread: InlineThread;
  props: DocumentInlineCommentsProps;
  firstMessage?: Comment;
  onSelect: () => void;
}

function ThreadPreview({ thread, props, firstMessage, onSelect }: ThreadPreviewProps) {
  return (
    <UnstyledButton
      onClick={onSelect}
      className="w-full text-left p-4 rounded-xl focus-visible:ring-2 focus-visible:ring-brand-1"
      testId={`inline-select-${thread.id}`}
    >
      <span className={`flex items-center gap-3 mb-3 ${props.canComment ? "pr-16" : ""}`}>
        {firstMessage?.author && <Avatar person={firstMessage.author} size="small" />}
        <span className="min-w-0">
          <span className="block font-semibold text-content-accent">{firstMessage?.author?.fullName}</span>
          <span className="block text-xs text-content-dimmed">
            <FormattedTime
              {...props.formattedTimePreferences}
              time={firstMessage?.insertedAt ?? thread.insertedAt}
              format="relative"
            />
          </span>
        </span>
      </span>
      <span className="block text-content-dimmed whitespace-pre-wrap break-words line-clamp-4">
        {firstMessage?.content ? richContentToString(parseContent(firstMessage.content)) : thread.anchor.quote}
      </span>
    </UnstyledButton>
  );
}

interface ThreadMessagesProps {
  thread: InlineThread;
  props: DocumentInlineCommentsProps;
  comments: Comment[];
  form: CommentFormState;
  editingFirstMessage: boolean;
  initiallyActiveReply: boolean;
}

function ThreadMessages({
  thread,
  props,
  comments,
  form,
  editingFirstMessage,
  initiallyActiveReply,
}: ThreadMessagesProps) {
  const richTextHandlers = {
    ...props.richTextHandlers,
    taskList: { canEdit: false as const },
    onCommentTaskItemChange: null,
  };

  return (
    <div>
      <blockquote
        className={`text-xs text-content-dimmed border-l-2 border-stroke-base pl-2 mb-3 break-words ${props.canComment ? "pr-10 min-h-8" : ""}`}
      >
        {thread.anchor.quote}
      </blockquote>
      {comments.map((comment, index) => {
        return (
          <CommentItem
            key={comment.id}
            comment={comment}
            form={form}
            currentUserId={props.currentUser.id}
            canComment={props.canComment}
            editDisabled={Boolean(thread.resolvedAt)}
            commentParentType="inline_thread"
            richTextHandlers={richTextHandlers}
            formattedTimePreferences={props.formattedTimePreferences}
            appearance="inline"
            initiallyEditing={index === 0 && editingFirstMessage}
          />
        );
      })}
      {props.canComment && !thread.resolvedAt && (
        <CommentInput
          compact
          hideToolbar
          initiallyActive={initiallyActiveReply && !editingFirstMessage}
          currentUser={props.currentUser}
          form={form}
          richTextHandlers={props.richTextHandlers}
          waitForSuccess
        />
      )}
    </div>
  );
}

function ResolveButton({
  thread,
  disabled,
  onResolve,
}: {
  thread: InlineThread;
  disabled?: boolean;
  onResolve: () => Promise<void>;
}) {
  const { t } = useTranslation();
  return (
    <UnstyledButton
      ariaLabel={thread.resolvedAt ? t("Reopen") : t("Resolve")}
      onClick={onResolve}
      disabled={disabled}
      className="p-1.5 rounded-full text-content-dimmed hover:text-brand-1 hover:bg-surface-highlight focus-visible:ring-2 focus-visible:ring-brand-1"
      testId={`inline-resolve-${thread.id}`}
    >
      {thread.resolvedAt ? <IconArrowBackUp size={20} /> : <IconCheck size={20} />}
    </UnstyledButton>
  );
}
