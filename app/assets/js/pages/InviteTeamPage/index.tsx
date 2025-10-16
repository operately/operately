import Api from "@/api";
import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as InviteLinks from "@/models/inviteLinks";

import { CopyToClipboard } from "@/components/CopyToClipboard";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";
import { PrimaryButton, SecondaryButton } from "turboui";
import { useCurrentCompany } from "../../contexts/CurrentCompanyContext";

export default { name: "InviteTeamPage", loader, Page } as PageModule;

async function loader(): Promise<null> {
  return null;
}

function Page() {
  const navigate = useNavigate();
  const company = useCurrentCompany()!;

  const [creating, setCreating] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState<InviteLinks.InviteLink | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateLink = async () => {
    setCreating(true);

    try {
      setError(null);
      const result = await Api.invitations.getCompanyInviteLink({});
      setInviteLink(result.inviteLink!);
    } catch (err) {
      setError("Failed to generate invite link. Please try again.");
      console.error("Error generating invite link:", err);
    } finally {
      setCreating(false);
    }
  };

  const inviteUrl = inviteLink ? InviteLinks.createInvitationUrl(inviteLink.token!) : "";

  const copyMessage = `Join me on Operately! Click this link to get started: ${inviteUrl}`;

  return (
    <Pages.Page title="Invite Your Team">
      <Paper.Root size="small">
        <Paper.Body>
          <div className="text-center">
            <div className="text-content-accent text-2xl font-extrabold mb-4">Invite Your Team</div>
            <div className="text-content-accent mb-8">
              Generate a shareable link to invite your team members to join your company.
            </div>

            {!inviteLink ? (
              <div>
                <PrimaryButton onClick={handleGenerateLink} loading={creating} testId="generate-invite-link">
                  Generate Invite Link
                </PrimaryButton>
                {error && <div className="text-red-600 mt-4">{error}</div>}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-green-600 font-medium">✓ Invite link generated successfully!</div>

                <div className="space-y-3">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-content-accent mb-2">
                      Shareable Link (expires in 7 days):
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 text-content-primary border border-surface-outline rounded-lg px-3 py-2 font-mono text-sm break-all bg-surface-base">
                        {inviteUrl}
                      </div>
                      <CopyToClipboard text={inviteUrl} size={20} />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-sm font-medium text-content-accent mb-2">Message Template:</label>
                    <div className="flex items-start space-x-2">
                      <div className="flex-1 text-content-primary border border-surface-outline rounded-lg px-3 py-2 text-sm bg-surface-base">
                        {copyMessage}
                      </div>
                      <CopyToClipboard text={copyMessage} size={20} />
                    </div>
                  </div>
                </div>

                <div className="space-x-3">
                  <PrimaryButton onClick={() => navigate(`/${company.id}`)}>Continue to Dashboard</PrimaryButton>
                  <SecondaryButton onClick={() => setInviteLink(null)}>Generate Another Link</SecondaryButton>
                </div>
              </div>
            )}
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
