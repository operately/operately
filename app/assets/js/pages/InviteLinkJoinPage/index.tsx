import Api, { InviteLink } from "@/api";
import * as Billing from "@/models/billing";
import React from "react";

import * as Pages from "@/components/Pages";

import { Paths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { redirect, useNavigate } from "react-router-dom";
import { InviteLinkJoinPage } from "turboui";

export default { name: "InviteLinkJoinPage", loader, Page } as PageModule;

interface LoaderResult {
  invite: InviteLink | null;
  token: string;
  pageState: InviteLinkJoinPage.PageState;
}

interface InviteAvailability {
  invite: InviteLink | null;
  memberLimitExceeded: boolean;
}

async function loader({ params }): Promise<LoaderResult | Response> {
  const token = params.token;

  if (!token) {
    return redirect("/");
  }

  const { invite, memberLimitExceeded } = await loadInviteAvailability(token);
  const loggedIn = !!window.appConfig.account?.id;

  if (!invite) {
    return { invite: null, token, pageState: "invalid-token" };
  } else if (!invite.isActive) {
    return { invite, token, pageState: "invalid-token" };
  } else if (memberLimitExceeded) {
    return redirect(Paths.inviteJoinFullPath(token));
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

      if (Billing.extractLimitError(error)?.code === "member_count_limit_exceeded") {
        navigate(Paths.inviteJoinFullPath(token));
        return;
      }

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

function prepInvitation(invite: InviteLink | null): InviteLinkJoinPage.Invitation | null {
  if (!invite?.company || !invite.author) return null;

  return {
    company: {
      id: invite.company.id!,
      name: invite.company.name!,
    },
    author: {
      id: invite.author.id,
      fullName: invite.author.fullName,
      avatarUrl: invite.author.avatarUrl,
    },
  };
}

async function loadInviteAvailability(token: string): Promise<InviteAvailability> {
  try {
    const result = await Api.invitations.getInviteLinkAvailability({ token });

    return {
      invite: result.inviteLink || null,
      memberLimitExceeded: result.memberLimitExceeded,
    };
  } catch (error) {
    console.error("Error loading invite availability:", error);
    return { invite: null, memberLimitExceeded: false };
  }
}
