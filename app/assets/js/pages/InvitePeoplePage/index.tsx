import Api from "@/api";
import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";
import * as InviteLinks from "@/models/inviteLinks";
import * as Time from "@/utils/time";

import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { GhostButton, PrimaryButton, SecondaryButton } from "turboui";
import { format, formatDistanceToNowStrict } from "date-fns";

export default { name: "InvitePeoplePage", loader, Page } as PageModule;

interface LoaderData {
  company: Companies.Company;
  inviteLinks: InviteLinks.InviteLink[];
}

async function loader({ params }): Promise<LoaderData> {
  const [company, inviteLinksResult] = await Promise.all([
    Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
    Api.invitations.listInviteLinks({ companyId: params.companyId }).then((res) => res.inviteLinks ?? []),
  ]);

  return {
    company,
    inviteLinks: inviteLinksResult,
  };
}

function Page() {
  const { company, inviteLinks } = Pages.useLoadedData<LoaderData>();
  const paths = usePaths();

  const [activeLink, setActiveLink] = React.useState<InviteLinks.InviteLink | null>(() => findMostRecentActiveLink(inviteLinks));
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "copied" | "error">("idle");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    setActiveLink((prev) => prev ?? findMostRecentActiveLink(inviteLinks));
  }, [inviteLinks]);

  React.useEffect(() => {
    if (copyStatus !== "copied") return;

    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const inviteUrl = activeLink?.token ? InviteLinks.createInvitationUrl(activeLink.token) : "";

  const handleCopy = React.useCallback(async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyStatus("copied");
    } catch (error) {
      console.error("Failed to copy invitation link", error);
      setCopyStatus("error");
    }
  }, [inviteUrl]);

  const handleGenerateLink = React.useCallback(async () => {
    setCreating(true);

    try {
      setCreateError(null);
      const result = await Api.invitations.createInviteLink({});
      setActiveLink(result.inviteLink ?? null);
    } catch (error) {
      console.error("Failed to create invite link", error);
      setCreateError("We couldn't generate a new invite link. Please try again.");
    } finally {
      setCreating(false);
    }
  }, []);

  return (
    <Pages.Page title={["Invite People", company.name!]} testId="invite-people-page">
      <Paper.Root size="medium">
        <Paper.Navigation items={[{ to: paths.companyAdminPath(), label: "Company Administration" }]} />

        <Paper.Body>
          <Paper.Header
            title="Invite People"
            subtitle="Share your company's secure invitation link or send individual invitations to bring new teammates on board."
            actions={
              <div className="flex flex-wrap gap-2 justify-end">
                <SecondaryButton linkTo={paths.companyManagePeopleListPath()} testId="manage-team-members" size="sm">
                  View Team Members
                </SecondaryButton>
                <GhostButton linkTo={paths.companyManagePeopleAddPeoplePath()} testId="invite-by-email" size="sm">
                  Invite by Email
                </GhostButton>
              </div>
            }
          />

          <InviteLinkCard
            inviteUrl={inviteUrl}
            link={activeLink}
            onCopy={handleCopy}
            onGenerateLink={handleGenerateLink}
            copyStatus={copyStatus}
            creating={creating}
            error={createError}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function InviteLinkCard({
  inviteUrl,
  link,
  onCopy,
  onGenerateLink,
  copyStatus,
  creating,
  error,
}: {
  inviteUrl: string;
  link: InviteLinks.InviteLink | null;
  onCopy: () => void;
  onGenerateLink: () => void;
  copyStatus: "idle" | "copied" | "error";
  creating: boolean;
  error: string | null;
}) {
  const hasLink = Boolean(link && link.token);

  return (
    <Paper.Section>
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-content-accent">Shareable invitation link</h2>
        <p className="text-content-dimmed mt-2">
          Give teammates instant access. Anyone with this link can join your company until it expires.
        </p>

        <div className="space-y-1 mt-6">
          <label className="text-sm font-bold text-content-accent" htmlFor="invite-link-input">
            Your invitation link
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="invite-link-input"
              value={inviteUrl}
              readOnly
              className="flex-1 min-w-0 px-3 py-2 border border-surface-outline bg-surface-dimmed rounded-lg bg-surface-base text-sm text-content-accent focus:outline-none focus:ring-2 focus:ring-brand-1"
              aria-label="Invitation link"
              placeholder="Generate link"
            />

            <PrimaryButton onClick={onCopy} disabled={!hasLink} size="sm" testId="copy-invite-link">
              {copyStatus === "copied" ? "Copied" : "Copy link"}
            </PrimaryButton>
          </div>

          {copyStatus === "error" && (
            <p className="text-sm text-content-error">We couldn't copy the link. Please copy it manually.</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SecondaryButton onClick={onGenerateLink} loading={creating} size="sm" testId="generate-invite-link">
            {hasLink ? "Generate new link" : "Generate invite link"}
          </SecondaryButton>

          {link && !creating && <LinkMeta link={link} />}
        </div>

        {error && <p className="text-sm text-content-error mt-3">{error}</p>}

        <p className="mt-8 text-xs text-content-dimmed">
          Need the link later? You can always find it from the Home page by using the Invite People button.
        </p>
      </div>
    </Paper.Section>
  );
}

function LinkMeta({ link }: { link: InviteLinks.InviteLink }) {
  const expiresAt = link.expiresAt ? Time.parse(link.expiresAt) : null;
  const insertedAt = link.insertedAt ? Time.parse(link.insertedAt) : null;

  if (!insertedAt) return null;

  return (
    <div className="text-xs text-content-dimmed">
      Generated {formatDistanceToNowStrict(insertedAt, { addSuffix: true })}
      {expiresAt && ` • Expires ${format(expiresAt, "MMM d, yyyy 'at' h:mm a")}`}
      {typeof link.useCount === "number" && ` • Used ${link.useCount} ${pluralizeUseCount(link.useCount)}`}
    </div>
  );
}

function pluralizeUseCount(count: number) {
  return count === 1 ? "time" : "times";
}

function findMostRecentActiveLink(inviteLinks: InviteLinks.InviteLink[]): InviteLinks.InviteLink | null {
  const activeLinks = inviteLinks.filter((link) => link.isActive && link.token);
  if (activeLinks.length === 0) {
    return null;
  }

  return activeLinks.sort((a, b) => getInsertedAt(b) - getInsertedAt(a))[0] ?? null;
}

function getInsertedAt(link: InviteLinks.InviteLink): number {
  const inserted = link.insertedAt ? Time.parse(link.insertedAt) : null;
  return inserted ? inserted.getTime() : 0;
}
