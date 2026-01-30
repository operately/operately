import React, { useCallback, useState } from "react";

import { SecondaryButton } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { IconRotate } from "../icons";
import { PageNew } from "../Page";
import { InviteLinkSection } from "./InviteLinkSection";

export namespace InvitePeoplePage {
  export interface Props {
    invitationLink: string | null;

    inviteIndividuallyHref?: string;
    onInviteIndividually?: () => void;

    onResetLink: () => void | Promise<void>;
    isResettingLink?: boolean;
    linkEnabled?: boolean;
    onToggleLink?: (enabled: boolean) => void;
    domainRestriction?: DomainRestrictionControls;
    errorMessage?: string;
    testId?: string;
  }

  export type CopyState = "idle" | "copied" | "error";

  export interface DomainRestrictionControls {
    enabled: boolean;
    value: string;
    onToggle?: (enabled: boolean) => void;
    onChange?: (value: string) => void;
    toggleLabel?: string;
    label?: string;
    error?: string;
    testId?: string;
  }
}

export function InvitePeoplePage(props: InvitePeoplePage.Props) {
  const [resettingLink, setResettingLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [internalLinkEnabled, setInternalLinkEnabled] = useState(props.linkEnabled ?? true);
  const linkEnabled = props.linkEnabled ?? internalLinkEnabled;
  const canInviteIndividually = Boolean(props.inviteIndividuallyHref || props.onInviteIndividually);
  const isResettingLink = props.isResettingLink ?? resettingLink;

  const handleResetLink = useCallback(async () => {
    if (isResettingLink || !linkEnabled) return;

    setResettingLink(true);
    try {
      await props.onResetLink();
    } finally {
      setResettingLink(false);
    }
  }, [isResettingLink, linkEnabled]);

  const handleLinkToggle = useCallback(
    (enabled: boolean) => {
      props.onToggleLink?.(enabled);
      if (props.linkEnabled === undefined) {
        setInternalLinkEnabled(enabled);
      }
    },
    [props.onToggleLink, props.linkEnabled],
  );

  const handleDomainToggle = useCallback(
    (enabled: boolean) => {
      props.domainRestriction?.onToggle?.(enabled);
    },
    [props.domainRestriction],
  );

  const handleDomainChange = useCallback(
    (value: string) => {
      // Only update local typed value; actual submit happens on blur via onBlur.
      props.domainRestriction?.onChange?.(value);
    },
    [props.domainRestriction],
  );

  const handleOpenResetConfirm = useCallback(() => {
    if (isResettingLink || !linkEnabled) return;
    setShowResetConfirm(true);
  }, [isResettingLink, linkEnabled]);

  const handleCancelResetConfirm = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  const handleConfirmResetLink = useCallback(async () => {
    setShowResetConfirm(false);
    await handleResetLink();
  }, [handleResetLink]);

  return (
    <PageNew className="bg-surface-bg" title="Invite People" size="medium" testId={props.testId}>
      <div className="px-6 py-10 md:w-[760px]">
        <header className="text-center">
          <h1 className="text-3xl font-semibold">Bring your team on board</h1>
        </header>

        {props.errorMessage ? (
          <div
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            data-test-id="invite-people-error"
          >
            {props.errorMessage}
          </div>
        ) : null}

        <div className="mt-8 space-y-8">
          <InviteLinkSection
            invitationLink={props.invitationLink}
            linkEnabled={linkEnabled}
            onToggleLink={handleLinkToggle}
            onOpenResetConfirm={handleOpenResetConfirm}
            isResettingLink={isResettingLink}
            domainRestriction={props.domainRestriction}
            onDomainToggle={handleDomainToggle}
            onDomainChange={handleDomainChange}
          />

          <section className="rounded-2xl border border-surface-outline bg-surface-base p-8 shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Inviting someone outside the team?</h2>
                <p className="mt-1 text-sm text-content-dimmed">Create a personal link just for them.</p>
              </div>
              <SecondaryButton
                linkTo={props.inviteIndividuallyHref}
                onClick={props.inviteIndividuallyHref ? undefined : props.onInviteIndividually}
                testId="invite-people-individual"
                disabled={!canInviteIndividually}
                size="sm"
              >
                Create invite
              </SecondaryButton>
            </div>
          </section>
        </div>

        <ConfirmDialog
          isOpen={showResetConfirm}
          onConfirm={handleConfirmResetLink}
          onCancel={handleCancelResetConfirm}
          title="Generate a new link"
          message="We’ll disable the current invite link and create a new one. Anyone holding the old link won’t be able to join anymore."
          confirmText="Generate new link"
          cancelText="Cancel"
          variant="danger"
          icon={IconRotate}
          testId="invite-people-reset-confirm"
        />
      </div>
    </PageNew>
  );
}

