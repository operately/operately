import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

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

export const LinkDisabled: Story = {
  args: {
    companyName: "Acme Widgets",
    invitationLink: "https://app.operately.com/invite/acme-widgets",
    inviteIndividuallyHref: "/people/new",
  },
  render: (args) => {
    const [linkEnabled, setLinkEnabled] = useState(false);
    const [domainsEnabled, setDomainsEnabled] = useState(false);
    const [domains, setDomains] = useState("operately.com, example.org");

    return (
      <InvitePeoplePage
        {...args}
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
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
  args: {
    companyName: "Acme Widgets",
    invitationLink: "https://app.operately.com/invite/acme-widgets",
    inviteIndividuallyHref: "/people/new",
  },
  render: (args) => {
    const [linkEnabled, setLinkEnabled] = useState(true);
    const [domainsEnabled, setDomainsEnabled] = useState(false);
    const [domains, setDomains] = useState("");
    const [link, setLink] = useState(args.invitationLink);

    return (
      <InvitePeoplePage
        {...args}
        invitationLink={link}
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
        onResetLink={async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setLink("https://app.operately.com/invite/acme-widgets-new");
        }}
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
  args: {
    companyName: "Acme Widgets",
    invitationLink: "https://app.operately.com/invite/acme-widgets",
    inviteIndividuallyHref: "/people/new",
  },
  render: (args) => {
    const [linkEnabled, setLinkEnabled] = useState(true);
    const [domainsEnabled, setDomainsEnabled] = useState(true);
    const [domains, setDomains] = useState("operately.com, example.org");
    const [link, setLink] = useState(args.invitationLink);

    return (
      <InvitePeoplePage
        {...args}
        invitationLink={link}
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
        onResetLink={async () => {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setLink("https://app.operately.com/invite/acme-widgets-updated");
        }}
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
