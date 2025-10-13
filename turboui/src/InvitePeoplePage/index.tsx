import React, { useCallback, useState } from "react";

import { SecondaryButton } from "../Button";
import { IconCopy, IconUserPlus, IconUsers } from "../icons";
import { ActionLink } from "../Link";
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

  return (
    <PageNew title="Invite People" size="medium" testId={props.testId}>
      <div className="px-6 py-10 md:w-[760px]">
        <header className="text-center">
          <div className="flex items-center justify-center gap-3 text-content-dimmed">
            <IconUsers size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">Invite to {props.companyName}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-content-strong">Invite your team</h1>
          <p className="mt-2 text-content-dimmed text-base">Invite everyone at once or send personal invitations.</p>
        </header>

        <div className="mt-8 space-y-8">
          <section className="rounded-2xl border border-surface-outline bg-surface-base p-8 shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-content-strong">Invite everyone at once</h2>
                <p className="mt-1 text-sm text-content-dimmed">
                  Share it in Slack, email, or wherever your crew hangs out.
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
                  onClick={handleCopyLink}
                  disabled={!canCopy}
                  size="sm"
                  icon={IconCopy}
                  testId="invite-people-copy-link"
                >
                  {copyState === "copied" ? "Copied" : "Copy"}
                </SecondaryButton>
              </div>

              {copyState === "error" && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  We couldn&apos;t copy the link automatically. Try copying it manually.
                </div>
              )}

              <p className="text-xs text-content-dimmed">
                {linkEnabled ? (
                  <>
                    Anyone with this link can join {props.companyName}.{" "}
                    {props.onResetLink && (
                      <ActionLink
                        onClick={handleResetLink}
                        underline="hover"
                        className={classNames("font-medium", isResettingLink && "pointer-events-none opacity-60")}
                        testId="invite-people-reset-link"
                      >
                        {isResettingLink ? "Generating…" : "Generate a new link"}
                      </ActionLink>
                    )}
                  </>
                ) : (
                  "Joining via link is disabled. Turn it back on when you want to share one link with your team."
                )}
              </p>
            </div>
            {linkEnabled && props.domainRestriction && (
              <div className="mt-8 border-t border-surface-outline pt-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-content-strong">
                      {props.domainRestriction.label ?? "Restrict by email domain"}
                    </h3>
                    <p className="mt-1 text-sm text-content-dimmed">
                      {props.domainRestriction.helperText ??
                        "Limit who can use the link. Personal invites work for anyone."}
                    </p>
                  </div>
                  <SwitchToggle
                    value={props.domainRestriction.enabled}
                    setValue={handleDomainToggle}
                    label={props.domainRestriction.toggleLabel ?? "Restrict domains"}
                    labelHidden
                    testId={props.domainRestriction.testId ?? "invite-people-domain-toggle"}
                  />
                </div>

                {props.domainRestriction.enabled && (
                  <div className="mt-6 space-y-2">
                    <TextField
                      variant="form-field"
                      text={props.domainRestriction.value}
                      onChange={handleDomainChange}
                      placeholder={props.domainRestriction.placeholder ?? "e.g. acme.com, example.org"}
                      label="Allowed domains"
                      error={props.domainRestriction.error}
                      className="sm:max-w-md"
                      testId="invite-people-domain-input"
                      readonly={!props.domainRestriction.onChange}
                    />
                    <p className="text-xs text-content-dimmed">
                      Separate multiple domains with commas. Leave empty to allow any domain while the link is on.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-surface-outline bg-surface-base p-8 shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-content-strong">Send personal invites</h2>
                <p className="mt-1 text-sm text-content-dimmed">
                  Generate a personal invite link for someone specific.
                </p>
              </div>
              <SecondaryButton
                linkTo={props.inviteIndividuallyHref}
                onClick={props.inviteIndividuallyHref ? undefined : props.onInviteIndividually}
                size="sm"
                icon={IconUserPlus}
                testId="invite-people-individual"
                disabled={!canInviteIndividually}
              >
                Invite
              </SecondaryButton>
            </div>
          </section>
        </div>
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
