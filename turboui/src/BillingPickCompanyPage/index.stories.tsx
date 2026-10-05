import type { Meta, StoryObj } from "@storybook/react-vite";
import { BillingPickCompanyPage } from ".";

const meta = {
  title: "Pages/BillingPickCompanyPage",
  component: BillingPickCompanyPage,
  parameters: { layout: "fullscreen" },
  args: {
    companies: [{ id: "acme", name: "Acme", memberCount: 12 }],
    plan: "team",
    billingPeriod: "monthly",
    billingPath: (id) => `/${id}/billing`,
  },
} satisfies Meta<typeof BillingPickCompanyPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { companies: [] } };

export const NoPlan: Story = { args: { plan: null, billingPeriod: null } };
