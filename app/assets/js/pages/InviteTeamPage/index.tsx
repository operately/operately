import * as Invitations from "@/models/invitations";
import React from "react";

import { loader, useLoadedData } from "./loader";
import { PageModule } from "@/routes/types";
import { InvitePeoplePage, showErrorToast } from "turboui";
import { usePaths } from "../../routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export default { name: "InviteTeamPage", loader, Page } as PageModule;

interface DomainState {
  enabled: boolean;
  value: string;
  error: string | null;
}

function Page() {
  const paths = usePaths();
  const { link } = useLoadedData();
  const data = useCompanyLoaderData();
  const company = data?.company;
  const navigationItems = React.useMemo(
    () => [
      { to: paths.companyAdminPath(), label: "Company Administration" },
      { to: paths.companyManagePeoplePath(), label: "Manage Team Members" },
    ],
    [paths],
  );

  const { mutateAsync: updateLink } = Invitations.useUpdateCompanyInviteLink();
  const { mutateAsync: resetLink, isPending: resettingLink } = Invitations.useResetCompanyInviteLink();
  const invitationUrl = `${window.location.origin}/join/${link.token}`;
  const [linkEnabled, setLinkEnabled] = React.useState(link.isActive ?? false);
  const [pageError, setPageError] = React.useState<string | null>(null);

  const allowedDomains = link.allowedDomains?.join(", ") ?? "";
  const [domainState, setDomainState] = React.useState<DomainState>(() => ({
    enabled: allowedDomains.length > 0,
    value: allowedDomains,
    error: null,
  }));

  React.useEffect(() => {
    setLinkEnabled(link.isActive ?? false);
  }, [link.isActive]);

  React.useEffect(() => {
    setDomainState({ enabled: allowedDomains.length > 0, value: allowedDomains, error: null });
  }, [allowedDomains]);

  const handleDomainToggle = async (enabled: boolean) => {
    const previousState = domainState;
    setDomainState((prev) => ({ ...prev, enabled }));

    try {
      await updateLink({
        allowedDomains: enabled ? domainState.value.split(",").map((e) => e.trim()) : [],
      });
    } catch (error) {
      showErrorToast("Network Error", "Failed to update trusted domains");
      setDomainState(previousState);
    }
  };

  const handleDomainChange = async (value: string) => {
    const oldValue = domainState.value;
    try {
      await updateLink({
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
      await updateLink({ isActive: newValue });
    } catch (error) {
      showErrorToast("Network Error", "Failed to disable invite link.");
      setLinkEnabled(oldValue);
    }
  };

  const handleResetLink = async () => {
    setPageError(null);

    try {
      await resetLink({});
    } catch (error) {
      showErrorToast("Network Error", "Failed to reset invite link.");
      setPageError("Failed to reset invite link. Please try again.");
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
