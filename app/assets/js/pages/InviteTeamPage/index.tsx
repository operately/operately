import type { InviteLink as InviteLinkType } from "@/api";
import Api from "@/api";
import React from "react";

import * as InviteLinks from "@/models/inviteLinks";

import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { InvitePeoplePage } from "turboui";
import { useCurrentCompany } from "../../contexts/CurrentCompanyContext";

export default { name: "InviteTeamPage", loader, Page } as PageModule;

async function loader(): Promise<null> {
  return null;
}

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

function Page() {
  const company = useCurrentCompany();
  const paths = usePaths();

  const [inviteLink, setInviteLink] = React.useState<InviteLinkType | null>(null);
  const [linkEnabled, setLinkEnabled] = React.useState(false);
  const [initializing, setInitializing] = React.useState(true);
  const [toggleLoading, setToggleLoading] = React.useState(false);
  const [resettingLink, setResettingLink] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [domainState, setDomainState] = React.useState<{
    enabled: boolean;
    value: string;
    error: string | null;
  }>({
    enabled: false,
    value: "",
    error: null,
  });

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

  const syncDomainStateFromLink = React.useCallback((link: InviteLinkType | null) => {
    const allowedDomains = link?.allowedDomains?.filter(Boolean) ?? [];
    setDomainState({
      enabled: allowedDomains.length > 0,
      value: allowedDomains.join(", "),
      error: null,
    });
  }, []);

  React.useEffect(() => {
    if (!company?.id) return;

    let cancelled = false;

    const loadInviteLink = async () => {
      setInitializing(true);
      try {
        const response = await Api.invitations.listInviteLinks({ companyId: company.id });
        if (cancelled) return;

        const links = (response.inviteLinks ?? []).filter(Boolean) as InviteLinkType[];
        const activeLink = links.find((link) => link.isActive);

        setInviteLink(activeLink ?? null);
        setLinkEnabled(Boolean(activeLink?.isActive));
        syncDomainStateFromLink(activeLink ?? null);
        setPageError(null);
      } catch (error) {
        if (!cancelled) {
          reportError("Failed to load the invite link. Please try again.", error);
          setInviteLink(null);
          setLinkEnabled(false);
          syncDomainStateFromLink(null);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    loadInviteLink();

    return () => {
      cancelled = true;
    };
  }, [company?.id, reportError, syncDomainStateFromLink]);

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

  const validateDomainInput = React.useCallback((): string[] | null => {
    if (!domainState.enabled) {
      return [];
    }

    const domains = domainState.value
      .split(/[\s,]+/)
      .map((domain) => domain.trim())
      .filter((domain) => domain.length > 0)
      .map((domain) => (domain.startsWith("@") ? domain.slice(1) : domain))
      .map((domain) => domain.toLowerCase());

    if (domains.length === 0) {
      setDomainState((prev) => ({
        ...prev,
        error: "Add at least one domain or disable restrictions.",
      }));
      return null;
    }

    const invalidDomain = domains.find((domain) => !DOMAIN_REGEX.test(domain));
    if (invalidDomain) {
      setDomainState((prev) => ({
        ...prev,
        error: `“${invalidDomain}” is not a valid domain.`,
      }));
      return null;
    }

    return domains;
  }, [domainState.enabled, domainState.value]);

  const createInviteLink = React.useCallback(
    async (allowedDomains: string[]) => {
      const response = await Api.invitations.createInviteLink({
        allowedDomains: allowedDomains.length > 0 ? allowedDomains : undefined,
      });
      setInviteLink(response.inviteLink);
      setLinkEnabled(true);
      syncDomainStateFromLink(response.inviteLink);
      setPageError(null);
    },
    [syncDomainStateFromLink],
  );

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 1b8455885 (Semantic updates)
  const revokeInviteLink = React.useCallback(async (link: InviteLinkType | null) => {
    if (!link?.id) return;
    const response = await Api.invitations.revokeInviteLink({ inviteLinkId: link.id });
    setInviteLink(response.inviteLink ?? null);
<<<<<<< HEAD
  }, []);
=======
  const revokeInviteLink = React.useCallback(
    async (link: InviteLinkType | null) => {
      if (!link?.id) return;
      const response = await Api.invitations.revokeInviteLink({ inviteLinkId: link.id });
      setInviteLink(response.inviteLink ?? null);
      setPageError(null);
    },
    [],
  );
>>>>>>> e3eff4247 (Feature tests)
=======
    setPageError(null);
  }, []);
>>>>>>> 1b8455885 (Semantic updates)

  const handleToggleLink = React.useCallback(
    async (enabled: boolean) => {
      if (!company?.id || toggleLoading || resettingLink || initializing) return;

      if (enabled) {
        const allowedDomains = validateDomainInput();
        if (allowedDomains === null) {
          setLinkEnabled(false);
          return;
        }

        setToggleLoading(true);
        setLinkEnabled(true);

        try {
          await createInviteLink(allowedDomains);
        } catch (error) {
          setLinkEnabled(false);
          reportError("Failed to enable the invite link. Please try again.", error);
        } finally {
          setToggleLoading(false);
        }

        return;
      }

      if (!inviteLink?.id) {
        setLinkEnabled(false);
        return;
      }

      setToggleLoading(true);
      setLinkEnabled(false);

      try {
        await revokeInviteLink(inviteLink);
      } catch (error) {
        setLinkEnabled(true);
        reportError("Failed to disable the invite link. Please try again.", error);
      } finally {
        setToggleLoading(false);
      }
    },
    [
      company?.id,
      toggleLoading,
      resettingLink,
      initializing,
      validateDomainInput,
      createInviteLink,
      inviteLink,
      revokeInviteLink,
      reportError,
    ],
  );

  const handleResetLink = React.useCallback(async () => {
    if (!linkEnabled || resettingLink || toggleLoading || initializing) return;

    const allowedDomains = validateDomainInput();
    if (allowedDomains === null) return;

    setResettingLink(true);
    try {
      await revokeInviteLink(inviteLink);
      await createInviteLink(allowedDomains);
      setPageError(null);
    } catch (error) {
      reportError("Failed to generate a new invite link. Please try again.", error);
    } finally {
      setResettingLink(false);
    }
  }, [
    linkEnabled,
    resettingLink,
    toggleLoading,
    initializing,
    validateDomainInput,
    revokeInviteLink,
    inviteLink,
    createInviteLink,
    reportError,
  ]);

  const invitationUrl = React.useMemo(() => {
    if (!linkEnabled || !inviteLink?.token) return "";
    return InviteLinks.createInvitationUrl(inviteLink.token);
  }, [inviteLink?.token, linkEnabled]);

  const domainRestriction = React.useMemo(() => {
    return {
      enabled: domainState.enabled,
      value: domainState.value,
      onToggle: handleDomainToggle,
      onChange: handleDomainChange,
      error: domainState.error ?? undefined,
      placeholder: "example.com, operately.com",
      helperText: "Separate multiple domains with commas.",
    };
  }, [domainState.enabled, domainState.value, domainState.error, handleDomainToggle, handleDomainChange]);

  if (!company) {
    return null;
  }

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
