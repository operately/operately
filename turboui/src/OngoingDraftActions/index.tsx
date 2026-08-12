import React from "react";
import { match } from "ts-pattern";

import { ActionLink } from "../Link";
import { CopyToClipboard } from "../CopyToClipboard";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { GhostButton, PrimaryButton } from "../Button";
import { IconX } from "../icons";

type ViewState = "actions" | "link";

export namespace OngoingDraftActions {
  export interface Props {
    state: "draft" | "scheduled";
    updatedAt: string;
    scheduledAt?: string | null;
    editPath: string;
    onPublish: () => void;
    formattedTimePreferences: FormattedTimePreferences;
    shareUrl?: string;
  }
}

export function OngoingDraftActions(props: OngoingDraftActions.Props) {
  const [viewState, setViewState] = React.useState<ViewState>("actions");

  return match(viewState)
    .with("actions", () => (
      <ContinueEditingActions
        {...props}
        setLinkVisible={() => setViewState("link")}
      />
    ))
    .with("link", () => (
      <ContinueEditingLink
        shareUrl={props.shareUrl ?? (typeof window !== "undefined" ? window.location.href : "")}
        setActionsVisible={() => setViewState("actions")}
      />
    ))
    .exhaustive();
}

function ContinueEditingActions({
  state,
  updatedAt,
  scheduledAt,
  editPath,
  onPublish,
  formattedTimePreferences,
  setLinkVisible,
}: OngoingDraftActions.Props & { setLinkVisible: () => void }) {
  const isScheduled = state === "scheduled";

  return (
    <div className="mb-4 bg-surface-dimmed p-4 rounded-2xl">
      <div className="text-center">
        {isScheduled ? (
          <>
            <span className="font-bold">This post is scheduled.</span>{" "}
            {scheduledAt && (
              <span>
                It will be posted on{" "}
                <FormattedTime {...formattedTimePreferences} time={scheduledAt} format="long-date" /> at{" "}
                <FormattedTime {...formattedTimePreferences} time={scheduledAt} format="time-only" />.
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-bold">This is an unpublished draft.</span>{" "}
            <span className="">
              Last edit was made{" "}
              <FormattedTime {...formattedTimePreferences} time={updatedAt} format="relative-time-or-date" />.
            </span>
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <PrimaryButton linkTo={editPath} size="base" testId="continue-editing">
          Continue editing
        </PrimaryButton>
        <GhostButton onClick={onPublish} size="base" testId="publish-now">
          Publish now
        </GhostButton>
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        <ActionLink className="font-medium" onClick={setLinkVisible} testId="share-link">
          Share a link
        </ActionLink>
      </div>
    </div>
  );
}

function ContinueEditingLink({
  shareUrl,
  setActionsVisible,
}: {
  shareUrl: string;
  setActionsVisible: () => void;
}) {
  return (
    <div className="mb-4 bg-surface-dimmed p-4 rounded-2xl">
      <div className="border border-stoke-base p-4 rounded-2xl relative">
        <div
          className="border border-stroke-base p-1 rounded-full absolute top-4 right-4 cursor-pointer hover:border-surface-outline"
          onClick={setActionsVisible}
        >
          <IconX size={20} />
        </div>

        <p className="mb-1 mt-4">Share this link to this draft with anyone who has access to this space:</p>

        <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between bg-surface-base">
          {shareUrl}

          <CopyToClipboard text={shareUrl} size={25} padding={1} className="" />
        </div>
      </div>
    </div>
  );
}
