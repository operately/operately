import React from "react";
import { useTranslation } from "react-i18next";
import type { InlineThread } from "../ApiTypes";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { ActionLink } from "../Link";
import { Avatar } from "../Avatar";
import { FormattedTime } from "../FormattedTime";
import { parseContent, richContentToString } from "../RichContent/contentOps";
import { CommentInput, CommentItem, type Comment, type CommentFormState } from "../CommentSection";
import { CommentMenu } from "../CommentSection/CommentItem";
import { IconCheck, IconArrowBackUp } from "../icons";
import { compareIds } from "../utils/ids";
import { showErrorToast } from "../Toasts";
import { tn } from "../i18n";
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
  const earlierReplies =
    thread.earlierReplyCount > 0 ? (
      <EarlierReplies
        count={thread.earlierReplyCount}
        status={props.earlierRepliesStatus?.get(thread.id)}
        onShow={() => props.onShowEarlierReplies(thread.id)}
      />
    ) : null;

  return (
    <section
      ref={cardRef}
      className={`group/thread relative rounded-xl text-sm bg-surface-base ${showMessages ? "shadow-lg border border-stroke-base p-4" : ""}`}
      data-inline-comment-card
      data-test-id={`inline-thread-${thread.id}`}
      data-resolved={Boolean(thread.resolvedAt)}
    >
      {!showMessages && (
        <ThreadPreview
          thread={thread}
          props={props}
          comments={comments}
          earlierReplies={earlierReplies}
          onSelect={onSelect}
        />
      )}

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
          earlierReplies={earlierReplies}
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
      const target = event.target;
      if (event.button !== 0 || !card || !(target instanceof Element)) return;
      // Let cards and passages handle selection before changing the margin layout.
      if (target.closest("[data-inline-comment-card], [data-inline-thread]")) return;
      if (
        card.querySelector(
          '[data-has-comment-draft], [data-editing-comment], [aria-haspopup="menu"][data-state="open"]',
        )
      )
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
  comments: Comment[];
  earlierReplies: React.ReactNode;
  onSelect: () => void;
}

function ThreadPreview({ thread, props, comments, earlierReplies, onSelect }: ThreadPreviewProps) {
  const messages = comments.length ? comments : [undefined];
  const selectClass = "w-full text-left rounded-xl focus-visible:ring-2 focus-visible:ring-brand-1";

  return (
    <div>
      <UnstyledButton onClick={onSelect} className={`${selectClass} p-4`} testId={`inline-select-${thread.id}`}>
        <PreviewMessages
          thread={thread}
          props={props}
          messages={earlierReplies ? messages.slice(0, 1) : messages}
          reserveActionSpace={props.canComment}
        />
      </UnstyledButton>
      {earlierReplies && <div className="px-4">{earlierReplies}</div>}
      {earlierReplies && messages.length > 1 && (
        <UnstyledButton onClick={onSelect} className={`${selectClass} p-4`}>
          <PreviewMessages thread={thread} props={props} messages={messages.slice(1)} />
        </UnstyledButton>
      )}
    </div>
  );
}

function PreviewMessages({
  thread,
  props,
  messages,
  reserveActionSpace,
}: {
  thread: InlineThread;
  props: DocumentInlineCommentsProps;
  messages: (Comment | undefined)[];
  reserveActionSpace?: boolean;
}) {
  return (
    <>
      {messages.map((message, index) => {
        const author = message?.author ?? thread.author;
        const timestamp = message?.insertedAt ?? thread.insertedAt;
        return (
          <span
            key={message?.id ?? thread.id}
            className="block not-first:border-t border-stroke-base not-first:mt-3 not-first:pt-3"
          >
            <span className={`flex items-center gap-3 mb-2 ${reserveActionSpace && index === 0 ? "pr-16" : ""}`}>
              {author && <Avatar person={author} size="small" />}
              <span className="min-w-0">
                <span className="block font-semibold text-content-accent">{author?.fullName}</span>
                <time className="block text-xs text-content-dimmed" dateTime={timestamp}>
                  <FormattedTime {...props.formattedTimePreferences} time={timestamp} format="relative" />
                </time>
              </span>
            </span>
            <span className="block text-content-dimmed whitespace-pre-wrap break-words">
              {message ? richContentToString(parseContent(message.content)) : thread.anchor.quote}
            </span>
          </span>
        );
      })}
    </>
  );
}

function EarlierReplies({
  count,
  status,
  onShow,
}: {
  count: number;
  status?: "loading" | "error";
  onShow: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div aria-busy={status === "loading"}>
      <ActionLink
        aria-expanded={false}
        disabled={status === "loading"}
        onClick={onShow}
        testId="inline-show-earlier-replies"
        underline="always"
      >
        {tn("Show {{count}} earlier reply", "Show {{count}} earlier replies", count)}
      </ActionLink>
      {status === "error" && (
        <p className="mt-2 text-xs text-content-error" role="alert">
          {t("Comments could not be loaded.")}
        </p>
      )}
    </div>
  );
}

interface ThreadMessagesProps {
  thread: InlineThread;
  props: DocumentInlineCommentsProps;
  comments: Comment[];
  earlierReplies: React.ReactNode;
  form: CommentFormState;
  editingFirstMessage: boolean;
  initiallyActiveReply: boolean;
}

function ThreadMessages({
  thread,
  props,
  comments,
  earlierReplies,
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
          <React.Fragment key={comment.id}>
            {index === 1 && earlierReplies}
            <CommentItem
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
          </React.Fragment>
        );
      })}
      {comments.length < 2 && earlierReplies}
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
