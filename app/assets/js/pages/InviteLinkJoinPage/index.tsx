import Api from "@/api";
import React from "react";

import { OperatelyLogo } from "@/components/OperatelyLogo";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as InviteLinks from "@/models/inviteLinks";
import { PageModule } from "@/routes/types";
import { redirect, useNavigate } from "react-router-dom";
import { Avatar, SecondaryButton } from "turboui";

export default { name: "InviteLinkJoinPage", loader, Page } as PageModule;

interface LoaderResult {
  inviteLink: InviteLinks.InviteLink | null;
  token: string;
  error?: string;
}

async function loader({ params }): Promise<LoaderResult> {
  const token = params.token;

  if (!token) {
    redirect("/");
  }

  try {
    const result = await Api.invitations.getInviteLink({ token });
    if (!result.inviteLink) {
      return { inviteLink: null, token, error: "Invalid invite link" };
    }
    return { inviteLink: result.inviteLink, token };
  } catch (error) {
    console.error("Error loading invite link:", error);
    return { inviteLink: null, token, error: "Failed to load invite link" };
  }
}

function Page() {
  const navigate = useNavigate();
  const { inviteLink, token, error } = Pages.useLoadedData() as LoaderResult;

  const [joinCompany, { loading: joining }] = Api.invitations.useJoinCompanyViaInviteLink();
  const [joinError, setJoinError] = React.useState<string | null>(null);

  const handleJoin = async () => {
    try {
      setJoinError(null);
      const result = await joinCompany({ token });

      if (result.error) {
        setJoinError(result.error);
        return;
      }

      if (result.company) {
        // Redirect to company dashboard
        navigate(`/${result.company.id}`);
      }
    } catch (err) {
      setJoinError("Failed to join company. Please try again.");
    }
  };

  const handleSignUp = () => {
    // Preserve the token in the signup flow
    navigate(`/sign_up?invite_token=${token}`);
  };

  if (error || !inviteLink) {
    return (
      <Pages.Page title="Invalid Invite Link">
        <Paper.Root size="small">
          <div className="mt-24"></div>
          <Paper.Body>
            <div className="text-center">
              <OperatelyLogo width="40" height="40" />
              <div className="text-content-accent text-2xl font-extrabold mt-6 mb-4">Invalid Invite Link</div>
              <div className="text-content-accent mb-8">{error || "This invite link is invalid or has expired."}</div>
              <div className="text-content-dimmed mb-6">
                Please contact the person who invited you for a new invite link.
              </div>
              <SecondaryButton onClick={() => navigate("/")}>Go to Homepage</SecondaryButton>
            </div>
          </Paper.Body>
        </Paper.Root>
      </Pages.Page>
    );
  }

  // Check if link is expired or inactive
  const isExpired = new Date(inviteLink.expiresAt!) < new Date();
  const isInactive = !inviteLink.isActive;

  if (isExpired || isInactive) {
    const errorMessage = isExpired ? "This invite link has expired" : "This invite link is no longer valid";

    return (
      <Pages.Page title="Expired Invite Link">
        <Paper.Root size="small">
          <div className="mt-24"></div>
          <Paper.Body>
            <div className="text-center">
              <OperatelyLogo width="40" height="40" />
              <div className="text-content-accent text-2xl font-extrabold mt-6 mb-4">Invite Link Expired</div>
              <div className="text-content-accent mb-8">{errorMessage}</div>
              <div className="text-content-dimmed mb-6">
                Please contact {inviteLink.author?.fullName} for a new invite link.
              </div>
              <SecondaryButton onClick={() => navigate("/")}>Go to Homepage</SecondaryButton>
            </div>
          </Paper.Body>
        </Paper.Root>
      </Pages.Page>
    );
  }

  return (
    <Pages.Page title="Join Company">
      <div className="">
        <div className="flex items-center justify-center gap-2 text-xl font-bold mb-6 mt-12">
          <OperatelyLogo width="30" height="30" /> Operately
        </div>

        <div className="bg-surface-base mx-auto p-12 w-[500px] border border-stroke-base rounded-xl shadow-lg">
          <div className="text-center flex flex-col items-center mb-8">
            <Avatar person={inviteLink.author!} size={64} className="mb-4" />
            {inviteLink.author?.fullName} invited you to join
            <div className="text-xl font-semibold">{inviteLink.company?.name}</div>
          </div>

          <div className="flex items-center flex-col items-stretch">
            <SecondaryButton onClick={handleJoin} loading={joining} testId="join-company">
              Sign up & Join
            </SecondaryButton>

            <div className="flex items-center my-4 w-full gap-4">
              <div className="border-t border-surface-outline flex-grow" />
              <div className="text-content-dimmed text-sm">Or, if you've used Operately before</div>
              <div className="border-t border-surface-outline flex-grow" />
            </div>

            <SecondaryButton onClick={handleSignUp}>Log in with your account</SecondaryButton>
          </div>
        </div>
      </div>
    </Pages.Page>
  );
}
