import Api from "@/api";
import React from "react";

import * as Pages from "@/components/Pages";
import * as InviteLinks from "@/models/inviteLinks";
import { PageModule } from "@/routes/types";
import { redirect, useNavigate } from "react-router-dom";
import { InviteLinkJoinPage } from "turboui";
import { assertPresent } from "../../utils/assertions";

export default { name: "InviteLinkJoinPage", loader, Page } as PageModule;

interface LoaderResult {
  invite: InviteLinks.InviteLink | null;
  token: string;
  pageState: InviteLinkJoinPage.PageState;
}

async function loader({ params }): Promise<LoaderResult> {
  const token = params.token;

  if (!token) {
    redirect("/");
  }

  const invite = await loadInviteLink(token);

  if (!invite) {
    return { invite: null, token, pageState: "invalid-token" };
  } else if (isExpired(invite)) {
    return { invite, token, pageState: "expired-token" };
  } else if (isInactive(invite)) {
    return { invite, token, pageState: "revoked-token" };
  } else {
    return { invite, token, pageState: "valid-token" };
  }
}

function Page() {
  const { invite, token, pageState } = Pages.useLoadedData() as LoaderResult;

  const navigate = useNavigate();

  const handleSignUpAndJoin = () => navigate(`/sign_up?invite_token=${token}`);
  const handleLogInAndJoin = () => navigate(`/log_in?invite_token=${token}`);

  return (
    <InviteLinkJoinPage
      invitation={prepInvitation(invite)}
      pageState={pageState}
      token={token}
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

function isExpired(invite: InviteLinks.InviteLink): boolean {
  if (!invite.expiresAt) return false;
  return new Date(invite.expiresAt) < new Date();
}

function isInactive(invite: InviteLinks.InviteLink): boolean {
  return invite.isActive === false;
}

async function loadInviteLink(token: string): Promise<InviteLinks.InviteLink | null> {
  try {
    const result = await Api.invitations.getInviteLink({ token });
    return result.inviteLink || null;
  } catch (error) {
    console.error("Error loading invite link:", error);
    return null;
  }
}
