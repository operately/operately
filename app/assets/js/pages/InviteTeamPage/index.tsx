import Api, { InviteLink } from "@/api";
import React from "react";

import { useLoadedData } from "@/components/Pages";
import { PageModule } from "@/routes/types";
import { InvitePeoplePage, showErrorToast } from "turboui";
import { usePaths } from "../../routes/paths";

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

  const invitationUrl = `${window.location.origin}/join/${link.token}`;
  const [linkEnabled, setLinkEnabled] = React.useState(link.isActive!);
  const [resettingLink] = React.useState(false);
  const [pageError] = React.useState<string | null>(null);

  const [domainState, setDomainState] = React.useState<DomainState>(() => {
    if (link.allowedDomains.length > 0) {
      return { enabled: true, value: link.allowedDomains.join(", "), error: null };
    } else {
      return { enabled: false, value: "", error: null };
    }
  });

  const handleDomainToggle = React.useCallback((enabled: boolean) => {
    setDomainState((prev) => ({
      ...prev,
      enabled,
      error: null,
    }));
  }, []);

  const handleDomainChange = React.useCallback((value: string) => {
    setDomainState((prev) => ({
      ...prev,
      value,
      error: null,
    }));
  }, []);

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

  const handleResetLink = () => {};

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
