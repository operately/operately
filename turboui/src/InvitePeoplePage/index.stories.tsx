import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useCallback } from "react";

import { InvitePeoplePage } from ".";

const meta = {
  title: "Pages/InvitePeoplePage",
  component: InvitePeoplePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof InvitePeoplePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Helper hook to manage invite link state with token regeneration
 */
function useInviteLinkState(baseUrl: string = "https://app.operately.com/invite") {
  const generateToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const [token, setToken] = useState(() => generateToken());
  const invitationLink = `${baseUrl}/${token}`;

  const handleResetLink = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    setToken(generateToken());
  }, []);

  return { invitationLink, handleResetLink };
}

export const LinkDisabled: Story = {
  args: {} as any,
  render: () => {
    const { invitationLink, handleResetLink } = useInviteLinkState();
    const [linkEnabled, setLinkEnabled] = useState(false);
    const [domainsEnabled, setDomainsEnabled] = useState(false);
    const [domains, setDomains] = useState("@operately.com, @example.org");

    return (
      <InvitePeoplePage
        invitationLink={invitationLink}
        inviteIndividuallyHref="/people/new"
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
        onResetLink={handleResetLink}
        domainRestriction={{
          enabled: domainsEnabled,
          onToggle: setDomainsEnabled,
          value: domains,
          onChange: setDomains,
        }}
      />
    );
  },
};

export const LinkEnabledNoRestrictions: Story = {
  args: {} as any,
  render: () => {
    const { invitationLink, handleResetLink } = useInviteLinkState();
    const [linkEnabled, setLinkEnabled] = useState(true);
    const [domainsEnabled, setDomainsEnabled] = useState(false);
    const [domains, setDomains] = useState("");

    return (
      <InvitePeoplePage
        invitationLink={invitationLink}
        inviteIndividuallyHref="/people/new"
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
        onResetLink={handleResetLink}
        domainRestriction={{
          enabled: domainsEnabled,
          onToggle: setDomainsEnabled,
          value: domains,
          onChange: setDomains,
        }}
      />
    );
  },
};

export const LinkEnabledRestricted: Story = {
  args: {} as any,
  render: () => {
    const { invitationLink, handleResetLink } = useInviteLinkState();
    const [linkEnabled, setLinkEnabled] = useState(true);
    const [domainsEnabled, setDomainsEnabled] = useState(true);
    const [domains, setDomains] = useState("operately.com, example.org");

    return (
      <InvitePeoplePage
        invitationLink={invitationLink}
        inviteIndividuallyHref="/people/new"
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
        onResetLink={handleResetLink}
        domainRestriction={{
          enabled: domainsEnabled,
          onToggle: setDomainsEnabled,
          value: domains,
          onChange: setDomains,
        }}
      />
    );
  },
};
