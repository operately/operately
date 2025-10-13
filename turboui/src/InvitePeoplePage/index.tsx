import React, { useCallback, useState } from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { IconCopy, IconUserPlus, IconUsers } from "../icons";
import { PageNew } from "../Page";

export namespace InvitePeoplePage {
  export interface Props {
    companyName: string;
    invitationLink: string | null;

    inviteIndividuallyHref?: string;
    onInviteIndividually?: () => void;

    onCopyLink?: (link: string) => void | Promise<void>;
    testId?: string;
  }

  export type CopyState = "idle" | "copied" | "error";
}

export function InvitePeoplePage(props: InvitePeoplePage.Props) {
  const [copyState, setCopyState] = useState<InvitePeoplePage.CopyState>("idle");
  const canCopy = Boolean(props.invitationLink);
  const canInviteIndividually = Boolean(props.inviteIndividuallyHref || props.onInviteIndividually);

  const handleCopyLink = useCallback(async () => {
    if (!props.invitationLink) return;

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
  }, [props.invitationLink, props.onCopyLink]);

  return (
    <PageNew title="Invite People" size="medium" testId={props.testId}>
      <div className="px-6 py-10 md:w-[700px]">
        <header className="text-center">
          <div className="flex items-center justify-center gap-3 text-content-dimmed">
            <IconUsers size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">Invite to {props.companyName}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-content-strong">Bring your team on board</h1>
          <p className="mt-2 text-content-dimmed text-base">Share one link with everyone, or invite them one by one.</p>
        </header>

        <div className="mt-8">
          <section className="rounded-xl border border-surface-outline bg-surface-base p-12 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-brand-1">
                <IconCopy size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-content-strong">Share one link</h2>
                <p className="text-sm text-content-dimmed">
                  Drop it in Slack, email, or wherever your team talks currently.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className="flex-1 rounded-lg border border-surface-outline bg-surface-base px-3 py-2 text-sm text-content-base focus:border-brand-1 focus:outline-none"
                  value={props.invitationLink ?? ""}
                  placeholder="Generating invite link…"
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
                <PrimaryButton
                  onClick={handleCopyLink}
                  disabled={!canCopy}
                  size="sm"
                  icon={IconCopy}
                  testId="invite-people-copy-link"
                >
                  {copyState === "copied" ? "Copied" : "Copy link"}
                </PrimaryButton>
              </div>

              {copyState === "error" && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  We couldn&apos;t copy the link automatically. Try copying it manually.
                </div>
              )}

              <p className="text-xs text-content-dimmed">Anyone with this link can join {props.companyName}.</p>
            </div>

            <div className="flex items-center gap-4 my-8">
              <div className="h-px flex-1 bg-surface-outline" />
              <span className="text-xs text-content-dimmed uppercase">or</span>
              <div className="h-px flex-1 bg-surface-outline" />
            </div>

            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-brand-1">
                    <IconUserPlus size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-content-strong">Invite people one by one</div>
                    <p className="mt-1 text-xs text-content-dimmed">
                      Prefer personal invites? Send them one at a time.
                    </p>
                  </div>
                </div>
                <SecondaryButton
                  linkTo={props.inviteIndividuallyHref}
                  onClick={props.inviteIndividuallyHref ? undefined : props.onInviteIndividually}
                  size="xs"
                  icon={IconUserPlus}
                  testId="invite-people-individual"
                  disabled={!canInviteIndividually}
                >
                  Invite one by one
                </SecondaryButton>
              </div>
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
