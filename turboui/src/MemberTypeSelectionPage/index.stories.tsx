import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MemberTypeSelectionPage } from ".";

const meta = {
  title: "Pages/MemberTypeSelectionPage",
  component: MemberTypeSelectionPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MemberTypeSelectionPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {} as any,
  render: () => {
    return (
      <MemberTypeSelectionPage
        companyName="Operately"
        navigationItems={[
          { label: "Company Administration", to: "/admin" },
          { label: "Manage Team Members", to: "/admin/people" },
        ]}
        teamMemberPath="/invite-team"
        outsideCollaboratorPath="/admin/manage-people/add?memberType=outside_collaborator"
      />
    );
  },
};
