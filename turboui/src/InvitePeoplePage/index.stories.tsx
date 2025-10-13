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

export const Default: Story = {
  args: {
    companyName: "Acme Widgets",
    invitationLink: "https://app.operately.com/invite/acme-widgets",
    inviteIndividuallyHref: "/people/new",
    onCopyLink: () => {},
  },
  render: (args) => {
    const [link, setLink] = useState(args.invitationLink);
    const [restrict, setRestrict] = useState(true);
    const [domains, setDomains] = useState("operately.com, example.org");
    const [linkEnabled, setLinkEnabled] = useState(true);

    return (
      <InvitePeoplePage
        {...args}
        invitationLink={link}
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
        onResetLink={async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setLink("https://app.operately.com/invite/acme-widgets-new");
        }}
        domainRestriction={{
          enabled: restrict,
          onToggle: setRestrict,
          value: domains,
          onChange: setDomains,
        }}
      />
    );
  },
};

export const GeneratingLink: Story = {
  args: {
    companyName: "Acme Widgets",
    invitationLink: null,
    onInviteIndividually: () => {},
  },
  render: (args) => {
    const [restrict, setRestrict] = useState(false);
    const [domains, setDomains] = useState("");
    const [linkEnabled, setLinkEnabled] = useState(false);

    return (
      <InvitePeoplePage
        {...args}
        linkEnabled={linkEnabled}
        onToggleLink={setLinkEnabled}
        domainRestriction={{
          enabled: restrict,
          onToggle: setRestrict,
          value: domains,
          onChange: setDomains,
        }}
      />
    );
  },
};
