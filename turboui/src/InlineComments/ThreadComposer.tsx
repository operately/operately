import React from "react";
import type { JSONContent } from "@tiptap/core";
import { useTranslation } from "react-i18next";
import { CommentInput } from "../CommentSection";
import type { DocumentInlineCommentsProps, InlineCommentTarget } from "./types";

interface ThreadComposerProps {
  props: DocumentInlineCommentsProps;
  target: InlineCommentTarget | null;
  staleTarget: boolean;
  onCancel: () => void;
  onPost: (content: JSONContent) => Promise<boolean>;
}

export function ThreadComposer({ props, target, staleTarget, onCancel, onPost }: ThreadComposerProps) {
  const { t } = useTranslation();

  return (
    <section
      className="bg-surface-base shadow-lg border border-stroke-base rounded-xl p-4"
      data-test-id="inline-new-thread"
    >
      <blockquote className="text-sm border-l-2 border-content-subtle pl-3 break-words">{target?.quote}</blockquote>
      {staleTarget && (
        <p role="alert" className="text-sm mt-3">
          {t("The document changed. Select the passage again to post your saved comment.")}
        </p>
      )}
      <CommentInput
        compact
        hideToolbar
        initiallyActive
        waitForSuccess
        submitDisabled={staleTarget}
        currentUser={props.currentUser}
        richTextHandlers={props.richTextHandlers}
        onCancel={onCancel}
        form={{
          items: [],
          submitting: Boolean(props.pending),
          commentDraftKey: `${props.draftKey}:new`,
          editComment: () => false,
          postComment: onPost,
        }}
      />
    </section>
  );
}
