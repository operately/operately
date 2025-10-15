import React, { useCallback, useState } from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { IconCopy, IconRotate } from "../icons";
import { PageNew } from "../Page";
import { SwitchToggle } from "../SwitchToggle";
import { TextField } from "../TextField";
import classNames from "../utils/classnames";

export namespace InvitePeoplePage {
  export interface Props {
    companyName: string;
    invitationLink: string | null;

    inviteIndividuallyHref?: string;
    onInviteIndividually?: () => void;

    onCopyLink?: (link: string) => void | Promise<void>;
    onResetLink?: () => void | Promise<void>;
    isResettingLink?: boolean;
    linkEnabled?: boolean;
    onToggleLink?: (enabled: boolean) => void;
    domainRestriction?: DomainRestrictionControls;
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
    helperText?: string;
    placeholder?: string;
    error?: string;
    testId?: string;
  }
}

export function InvitePeoplePage(props: InvitePeoplePage.Props) {
  const [copyState, setCopyState] = useState<InvitePeoplePage.CopyState>("idle");
  const [resettingLink, setResettingLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [internalLinkEnabled, setInternalLinkEnabled] = useState(props.linkEnabled ?? true);
  const linkEnabled = props.linkEnabled ?? internalLinkEnabled;
  const canCopy = Boolean(props.invitationLink) && linkEnabled;
  const canInviteIndividually = Boolean(props.inviteIndividuallyHref || props.onInviteIndividually);
  const isResettingLink = props.isResettingLink ?? resettingLink;

  const handleCopyLink = useCallback(async () => {
    if (!props.invitationLink || !linkEnabled) return;

    try {
      await copyToClipboard(props.invitationLink);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      return;
    }

    if (props.onCopyLink) {
      Promise.resolve(props.onCopyLink(props.invitationLink)).catch(() => undefined);
    }
  }, [props.invitationLink, props.onCopyLink, linkEnabled]);

  const handleResetLink = useCallback(async () => {
    if (!props.onResetLink || isResettingLink || !linkEnabled) return;

    setResettingLink(true);
    try {
      await props.onResetLink();
    } finally {
      setResettingLink(false);
    }
  }, [props.onResetLink, isResettingLink, linkEnabled]);

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
      props.domainRestriction?.onChange?.(value);
    },
    [props.domainRestriction],
  );

  const handleOpenResetConfirm = useCallback(() => {
    if (!props.onResetLink || isResettingLink || !linkEnabled) return;
    setShowResetConfirm(true);
  }, [props.onResetLink, isResettingLink, linkEnabled]);

  const handleCancelResetConfirm = useCallback(() => {
    setShowResetConfirm(false);
  }, []);

  const handleConfirmResetLink = useCallback(async () => {
    setShowResetConfirm(false);
    await handleResetLink();
  }, [handleResetLink]);

  const domainTestId = props.domainRestriction?.testId ?? "invite-people-domain-toggle";
  const domainRadioName = `${domainTestId}-options`;

  return (
    <PageNew className="bg-surface-bg" title="Invite People" size="medium" testId={props.testId}>
      <div className="px-6 py-10 md:w-[760px]">
        <header className="text-center">
          <h1 className="text-3xl font-semibold">Bring your team on board</h1>
        </header>

        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-surface-outline bg-surface-base p-8 shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Invite your whole team at once</h2>
                <p className="mt-1 text-sm text-content-dimmed">
                  Share it in group chat, via email, or wherever your team is.
                </p>
              </div>
              <SwitchToggle
                value={linkEnabled}
                setValue={handleLinkToggle}
                label="Enable invite link"
                labelHidden
                testId="invite-people-link-toggle"
              />
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={classNames(
                    "flex-1 rounded-lg border border-surface-outline bg-surface-raised px-3 py-2 text-sm text-content-base focus:border-brand-1 focus:outline-none",
                    !linkEnabled && "opacity-60",
                  )}
                  value={linkEnabled ? props.invitationLink ?? "" : ""}
                  placeholder={linkEnabled ? "Generating invite link…" : "Invite link disabled"}
                  readOnly
                  disabled={!linkEnabled}
                  onFocus={(event) => event.currentTarget.select()}
                />
                <SecondaryButton
                  onClick={handleOpenResetConfirm}
                  size="sm"
                  disabled={isResettingLink}
                  testId="invite-people-reset-link"
                  icon={IconRotate}
                >
                  {" "}
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleCopyLink}
                  disabled={!canCopy}
                  size="sm"
                  icon={IconCopy}
                  testId="invite-people-copy-link"
                >
                  {copyState === "copied" ? "Copied" : "Copy"}
                </PrimaryButton>
              </div>

              {copyState === "error" && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  We couldn&apos;t copy the link automatically. Try copying it manually.
                </div>
              )}
            </div>

            {linkEnabled && props.domainRestriction ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-content-strong">Who can join?</p>

                <div className="space-y-1" data-test-id={domainTestId}>
                  <label
                    className={classNames(
                      "inline-flex items-center gap-3 text-sm text-content-strong",
                      props.domainRestriction.onToggle ? "cursor-pointer" : "cursor-default opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name={domainRadioName}
                      value="anyone"
                      checked={!props.domainRestriction.enabled}
                      onChange={() => handleDomainToggle(false)}
                      disabled={!props.domainRestriction.onToggle}
                      className="h-4 w-4 border-surface-outline text-brand-1 focus:ring-brand-1"
                    />
                    <span>Anyone with the link</span>
                  </label>

                  <div className="space-y-2 text-sm text-content-strong">
                    <label
                      className={classNames(
                        "inline-flex items-center gap-3",
                        props.domainRestriction.onToggle ? "cursor-pointer" : "cursor-default opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        name={domainRadioName}
                        value="domains"
                        checked={props.domainRestriction.enabled}
                        onChange={() => handleDomainToggle(true)}
                        disabled={!props.domainRestriction.onToggle}
                        className="h-4 w-4 border-surface-outline text-brand-1 focus:ring-brand-1"
                      />
                      <span>{props.domainRestriction.label ?? "Trusted email domains only"}</span>
                    </label>

                    {props.domainRestriction.enabled && (
                      <div className="ml-7 space-y-2">
                        <TextField
                          variant="form-field"
                          text={props.domainRestriction.value}
                          onChange={handleDomainChange}
                          placeholder={props.domainRestriction.placeholder ?? "e.g. @acme.com, @example.org"}
                          error={props.domainRestriction.error}
                          className={classNames("sm:max-w-md", !props.domainRestriction.onChange && "opacity-60")}
                          testId="invite-people-domain-input"
                          readonly={!props.domainRestriction.onChange}
                        />
                        <p className="text-xs text-content-dimmed">
                          {props.domainRestriction.helperText ?? "Separate multiple domains with commas."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : linkEnabled ? (
              <p className="mt-8 text-sm text-content-dimmed">Anyone with this link can join {props.companyName}.</p>
            ) : null}
          </section>

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
          title="Revoke invite link?"
          message="This will disable the current invite link and generate a new one. Anyone with the old link will no longer be able to join."
          confirmText="Revoke link"
          cancelText="Cancel"
          variant="danger"
          testId="invite-people-reset-confirm"
        />
      </div>
    </PageNew>
  );
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.setAttribute("readonly", "true");

  document.body.appendChild(textarea);
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy command failed");
  }
}
