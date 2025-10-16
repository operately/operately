import Api, { InviteLink } from "@/api";
import React from "react";

import * as Pages from "@/components/Pages";

import { PageModule } from "@/routes/types";
import { redirect, useNavigate } from "react-router-dom";
import { InviteLinkJoinPage } from "turboui";
import { assertPresent } from "../../utils/assertions";

export default { name: "InviteLinkJoinPage", loader, Page } as PageModule;

interface LoaderResult {
  invite: InviteLink | null;
  token: string;
  pageState: InviteLinkJoinPage.PageState;
}

async function loader({ params }): Promise<LoaderResult> {
  const token = params.token;

  if (!token) {
    redirect("/");
  }

  const invite = await loadInviteLink(token);
  const loggedIn = !!window.appConfig.account?.id;

  if (!invite) {
    return { invite: null, token, pageState: "invalid-token" };
  } else if (isExpired(invite)) {
    return { invite, token, pageState: "expired-token" };
  } else if (isInactive(invite)) {
    return { invite, token, pageState: "revoked-token" };
  } else if (loggedIn) {
    return { invite, token, pageState: "logged-in-user-valid-token" };
  } else {
    return { invite, token, pageState: "anonymous-user-valid-token" };
  }
}

function Page() {
  const { invite, token, pageState } = Pages.useLoadedData() as LoaderResult;

  const navigate = useNavigate();
  const [joining, setJoining] = React.useState(false);
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

    setJoining(true);
    setJoinError(null);

    try {
      const response = await Api.invitations.joinCompanyViaInviteLink({ token });
      const companyId = response.company?.id;

      if (companyId) {
        window.location.href = `/${companyId}`;
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error joining company via invite link", error);
      setJoinError("Something went wrong while joining. Please try again.");
    } finally {
      setJoining(false);
    }
  }, [token]);

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

function prepInvitation(invite: InviteLinks.InviteLink | null): InviteLinkJoinPage.Invitation | null {
  if (!invite) return null;

  assertPresent(invite.company);
  assertPresent(invite.author);

  return {
    company: {
      id: invite.company!.id!,
      name: invite.company!.name!,
    },
    author: {
      id: invite.author.id,
      fullName: invite.author.fullName,
      avatarUrl: invite.author.avatarUrl,
    },
  };
}

function isExpired(invite: InviteLink): boolean {
  if (!invite.expiresAt) return false;
  return new Date(invite.expiresAt) < new Date();
}

function isInactive(invite: InviteLink): boolean {
  return invite.isActive === false;
}

async function loadInviteLink(token: string): Promise<InviteLink | null> {
  try {
    const result = await Api.invitations.getInviteLinkByToken({ token });
    return result.inviteLink || null;
  } catch (error) {
    console.error("Error loading invite link:", error);
    return null;
  }
}
