import type { Meta, StoryObj } from "@storybook/react-vite";
import { SaasAdminAccountActionsMenu } from "./index";

const meta = {
  title: "Components/SaasAdminAccountActionsMenu",
  component: SaasAdminAccountActionsMenu,
  parameters: { layout: "centered" },
  args: {
    account: { id: "account-123", siteAdmin: false },
    onCopyId: () => console.log("Copy account ID"),
    onPromote: () => console.log("Promote account"),
    onDemote: () => console.log("Demote account"),
    onDelete: () => console.log("Delete account"),
  },
} satisfies Meta<typeof SaasAdminAccountActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegularAccount: Story = {};

export const SiteAdmin: Story = {
  args: { account: { id: "admin-123", siteAdmin: true } },
};
