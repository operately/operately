import Api, { InviteLink } from "@/api";
import React from "react";

import { useLoadedData } from "@/components/Pages";
import type * as Companies from "@/models/companies";
import { PageModule } from "@/routes/types";
import { InvitePeoplePage, showErrorToast } from "turboui";
import { usePaths } from "../../routes/paths";
import { useRouteLoaderData } from "react-router-dom";

export default { name: "InviteTeamPage", loader, Page } as PageModule;

interface LoaderData {
  link: InviteLink;
}

async function loader(): Promise<LoaderData> {
  const link = await Api.invitations.getCompanyInviteLink({});

  return { link: link.inviteLink };
}

interface DomainState {
  enabled: boolean;
  value: string;
  error: string | null;
}

function Page() {
  const paths = usePaths();
  const { link } = useLoadedData();
  const data = useRouteLoaderData("companyRoot") as { company?: Companies.Company } | null;
  const company = data?.company;
  const navigationItems = React.useMemo(
    () => [
      { to: paths.companyAdminPath(), label: "Company Administration" },
      { to: paths.companyManagePeoplePath(), label: "Manage Team Members" },
    ],
    [paths],
  );

  const [currentToken, setCurrentToken] = React.useState(link.token!);
  const invitationUrl = `${window.location.origin}/join/${currentToken}`;
  const [linkEnabled, setLinkEnabled] = React.useState(link.isActive!);
  const [resettingLink, setResettingLink] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);

  const [domainState, setDomainState] = React.useState<DomainState>(() => {
    if (link.allowedDomains.length > 0) {
      return { enabled: true, value: link.allowedDomains.join(", "), error: null };
    } else {
      return { enabled: false, value: "", error: null };
    }
  });

  const handleDomainToggle = async (enabled: boolean) => {
    const oldValue = domainState.value;
    setDomainState((prev) => ({ ...prev, enabled }));

    try {
      await Api.invitations.updateCompanyInviteLink({
        allowedDomains: enabled ? domainState.value.split(",").map((e) => e.trim()) : [],
      });
    } catch (error) {
      showErrorToast("Network Error", "Failed to update trusted domains");
      setDomainState((prev) => ({ ...prev, oldValue }));
    }
  };

  const handleDomainChange = async (value: string) => {
    const oldValue = domainState.value;
    try {
      await Api.invitations.updateCompanyInviteLink({
        allowedDomains: value.split(",").map((e) => e.trim()),
      });
    } catch (error) {
      showErrorToast("Network Error", "Failed to update trusted domains");
      setDomainState((prev) => ({ ...prev, value: oldValue }));
    }
  };

  const handleToggleLink = async () => {
    const oldValue = linkEnabled;
    const newValue = !linkEnabled;

    try {
      setLinkEnabled(newValue);
      await Api.invitations.updateCompanyInviteLink({ isActive: newValue });
    } catch (error) {
      showErrorToast("Network Error", "Failed to disable invite link.");
      setLinkEnabled(oldValue);
    }
  };

  const handleResetLink = async () => {
    setResettingLink(true);
    setPageError(null);

    try {
      const result = await Api.invitations.resetCompanyInviteLink({});
      setCurrentToken(result.inviteLink.token!);
    } catch (error) {
      showErrorToast("Network Error", "Failed to reset invite link.");
      setPageError("Failed to reset invite link. Please try again.");
    } finally {
      setResettingLink(false);
    }
  };

  const domainRestriction = React.useMemo(() => {
    return {
      enabled: domainState.enabled,
      value: domainState.value,
      onToggle: handleDomainToggle,
      onChange: handleDomainChange,
      error: domainState.error ?? undefined,
    };
  }, [domainState.enabled, domainState.value, domainState.error, handleDomainToggle, handleDomainChange]);

  return (
    <InvitePeoplePage
      companyName={company?.name || ""}
      navigationItems={navigationItems}
      invitationLink={invitationUrl}
      onToggleLink={handleToggleLink}
      linkEnabled={linkEnabled}
      onResetLink={handleResetLink}
      isResettingLink={resettingLink}
      domainRestriction={domainRestriction}
      inviteIndividuallyHref={paths.companyManagePeopleAddPeoplePath()}
      testId="invite-team-page"
      errorMessage={pageError ?? undefined}
    />
  );
}
