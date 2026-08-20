import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { CompanyAdminPage } from "./index";

const meta = {
  title: "Pages/CompanyAdminPage",
  component: CompanyAdminPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CompanyAdminPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const people = [
  { id: "1", fullName: "Alice Owner", avatarUrl: null },
  { id: "2", fullName: "Bob Admin", avatarUrl: null },
  { id: "3", fullName: "Carol Member", avatarUrl: null },
];

const baseProps: CompanyAdminPage.Props = {
  companyName: "Acme Corp",
  admins: [people[0]!, people[1]!],
  owners: [people[0]!],
  isAdmin: true,
  isOwner: true,
  billingEnabled: true,
  canManageBilling: true,
  canEditDetails: true,
  canEditTrustedEmailDomains: true,
  homePath: "#",
  permissionsPath: "#",
  managePeoplePath: "#",
  restoreSuspendedPeoplePath: "#",
  billingPath: "#",
  renameCompanyPath: "#",
  manageAdminsPath: "#",
  trustedDomainsPath: "#",
  exportPath: "#",
  onDeleteCompany: async () => {
    console.log("Delete company confirmed");
  },
};

export const Owner: Story = {
  args: baseProps,
};

export const AdminOnly: Story = {
  args: {
    ...baseProps,
    isAdmin: true,
    isOwner: false,
    canManageBilling: false,
    canEditDetails: false,
    canEditTrustedEmailDomains: false,
  },
};

export const PlainMember: Story = {
  args: {
    ...baseProps,
    isAdmin: false,
    isOwner: false,
    canManageBilling: false,
    canEditDetails: false,
    canEditTrustedEmailDomains: false,
  },
};

export const BillingDisabled: Story = {
  args: {
    ...baseProps,
    billingEnabled: false,
  },
};
