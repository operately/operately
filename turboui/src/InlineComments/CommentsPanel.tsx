import React from "react";
import { useTranslation } from "react-i18next";
import type { InlineThread } from "../ApiTypes";
import { SecondaryButton } from "../Button";
import { SlideIn } from "../SlideIn";
import { FloatingComments, type FloatingComment } from "./FloatingComments";
import { Thread } from "./Thread";
import { attachedRange, type DocumentInlineCommentsProps } from "./types";

interface CommentsPanelProps {
  props: DocumentInlineCommentsProps;
  threads: InlineThread[];
  replyThreadId: string | null;
  onSelectThread: (id: string) => void;
  composer: FloatingComment | null;
  mobile: boolean;
  showAll: boolean;
  open: boolean;
  onClose: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

export function CommentsPanel({
  props,
  threads,
  replyThreadId,
  onSelectThread,
  composer,
  mobile,
  showAll,
  open,
  onClose,
  contentRef,
}: CommentsPanelProps) {
  const { t } = useTranslation();
  const missing = Boolean(
    props.activeThreadId &&
    !props.loading &&
    !props.error &&
    !props.threads.some((thread) => thread.id === props.activeThreadId),
  );
  const status = props.loading || props.error || missing ? <CommentStatus props={props} missing={missing} /> : null;
  const items = threads.map((thread) => ({
    id: thread.id,
    resolved: Boolean(thread.resolvedAt),
    from: attachedRange(thread, props.documentVersion)?.from,
    content: (
      <Thread
        thread={thread}
        props={props}
        active={thread.id === props.activeThreadId}
        expanded={showAll}
        initiallyActiveReply={thread.id === replyThreadId}
        onSelect={() => onSelectThread(thread.id)}
      />
    ),
  }));

  if (mobile || showAll) {
    const previews =
      !open && (items.length > 0 || status) ? (
        <div className="p-4 space-y-4" data-test-id="inline-comments-previews">
          {status}
          {items.map((item) => (
            <React.Fragment key={item.id}>{item.content}</React.Fragment>
          ))}
        </div>
      ) : null;
    return (
      <>
        {previews}
        <SlideIn
          isOpen={open}
          onClose={onClose}
          width="min(28rem, 100%)"
          title={t("Inline comments")}
          closeOnBackdropClick={false}
          trapFocus
          testId="inline-comments-mobile"
        >
          <div className="p-4 pt-12 space-y-4" data-test-id="inline-comments-panel">
            {showAll && <h2 className="text-lg font-bold">{t("Inline comments")}</h2>}
            {status}
            {composer?.content}
            {showAll ? (
              <>
                {!status && items.length === 0 && (
                  <p className="text-sm text-content-dimmed" data-test-id="inline-comments-empty">
                    {t("No inline comments yet.")}
                  </p>
                )}
                {items
                  .filter((item) => !item.resolved)
                  .map((item) => (
                    <React.Fragment key={item.id}>{item.content}</React.Fragment>
                  ))}
                {items.some((item) => item.resolved) && (
                  <section className="space-y-4" data-test-id="inline-comments-resolved">
                    <h3 className="font-semibold text-content-dimmed">{t("Resolved")}</h3>
                    {items
                      .filter((item) => item.resolved)
                      .map((item) => (
                        <React.Fragment key={item.id}>{item.content}</React.Fragment>
                      ))}
                  </section>
                )}
              </>
            ) : (
              items.map((item) => <React.Fragment key={item.id}>{item.content}</React.Fragment>)
            )}
          </div>
        </SlideIn>
      </>
    );
  }

  const hasFloatingComments = items.length > 0 || Boolean(composer);
  const floatingItems: FloatingComment[] = [...items];
  if (composer) floatingItems.push(composer);
  if (status) floatingItems.push({ id: "status", content: status });

  return (
    <div>
      {hasFloatingComments ? (
        <FloatingComments items={floatingItems} contentRef={contentRef} />
      ) : (
        status && <div className="px-4 pb-4 sm:px-12 lg:px-28">{status}</div>
      )}
    </div>
  );
}

function CommentStatus({ props, missing }: { props: DocumentInlineCommentsProps; missing: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {props.loading && (
        <p role="status" className="text-sm text-content-subtle">
          {t("Loading comments...")}
        </p>
      )}
      {props.error && (
        <div role="alert" className="space-y-2">
          <p>{t("Comments could not be loaded.")}</p>
          <SecondaryButton size="xs" onClick={() => void props.onReload()}>
            {t("Retry")}
          </SecondaryButton>
        </div>
      )}
      {missing && <p role="status">{t("This comment thread is no longer available.")}</p>}
    </>
  );
}
