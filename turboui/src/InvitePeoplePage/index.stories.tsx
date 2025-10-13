import type { Meta, StoryObj } from "@storybook/react";

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
    managePeopleHref: "/admin/people",
  },
};

export const GeneratingLink: Story = {
  args: {
    companyName: "Acme Widgets",
    invitationLink: null,
    onInviteIndividually: () => {},
    managePeopleHref: "/admin/people",
  },
};
