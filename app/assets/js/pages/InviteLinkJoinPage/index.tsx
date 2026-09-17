import { type InviteLink } from "@/api";
import * as Invitations from "@/models/invitations";
import * as Billing from "@/models/billing";
import React from "react";

import { loader, useLoadedData } from "./loader";

import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router";
import { InviteLinkJoinPage } from "turboui";

export default { name: "InviteLinkJoinPage", loader, Page } as PageModule;

function Page() {
  const { invite, token, pageState } = useLoadedData();

  const navigate = useNavigate();
  const { mutateAsync: join, isPending: joining } = Invitations.useJoinCompanyViaInviteLink();
  const [joinError, setJoinError] = React.useState<string | null>(null);

  const handleSignUpAndJoin = () => {
    setJoinError(null);
    navigate(`/sign_up?invite_token=${token}`);
  };
  const handleLogInAndJoin = () => {
    setJoinError(null);
    navigate(`/log_in?invite_token=${token}`);
  };
  const handleJoin = React.useCallback(async () => {
    if (!token) return;

    setJoinError(null);

    try {
      const response = await join({ token });
      const companyId = response.company?.id;

      if (companyId) {
        window.location.href = `/${companyId}`;
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error joining company via invite link", error);

      if (Billing.extractLimitError(error)?.code === "member_count_limit_exceeded") {
        navigate(Paths.inviteJoinFullPath(token));
        return;
      }

      setJoinError("Something went wrong while joining. Please try again.");
    }
  }, [token, join, navigate]);

  return (
    <InviteLinkJoinPage
      invitation={prepInvitation(invite)}
      pageState={pageState}
      token={token}
      handleJoin={handleJoin}
      joining={joining}
      joinError={joinError}
      handleSignUpAndJoin={handleSignUpAndJoin}
      handleLogInAndJoin={handleLogInAndJoin}
    />
  );
}

function prepInvitation(invite: InviteLink | null): InviteLinkJoinPage.Invitation | null {
  if (!invite?.company?.id || !invite.company.name || !invite.author) return null;

  return {
    company: {
      id: invite.company.id,
      name: invite.company.name,
    },
    author: {
      id: invite.author.id,
      fullName: invite.author.fullName,
      avatarUrl: invite.author.avatarUrl,
    },
  };
}
